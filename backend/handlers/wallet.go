package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/golang-jwt/jwt/v4"
)

// --- User Wallet Handlers ---

func GetWalletInfo(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var profile models.Profile
	database.DB.Where("user_id = ?", userID).First(&profile)

	var transactions []models.Transaction
	database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&transactions)

	return c.JSON(fiber.Map{
		"balance":      profile.Balance,
		"transactions": transactions,
	})
}

func RequestTopUp(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var body struct {
		Amount   float64 `json:"amount"`
		ProofURL string  `json:"proof_url"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	transaction := models.Transaction{
		ID:        uuid.New(),
		UserID:    userID,
		Amount:    body.Amount,
		Type:      "topup",
		Status:    "pending",
		Reference: "Top Up Saldo",
		ProofURL:  body.ProofURL,
	}

	database.DB.Create(&transaction)
	return c.JSON(transaction)
}

func PayWithWallet(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	courseID, _ := uuid.Parse(c.Params("id"))

	// Get course price
	var course models.Course
	database.DB.Where("id = ?", courseID).First(&course)

	// Get user profile
	var profile models.Profile
	database.DB.Where("user_id = ?", userID).First(&profile)

	if profile.Balance < course.Price {
		return c.Status(400).JSON(fiber.Map{"error": "Saldo tidak mencukupi"})
	}

	// 1. Deduct Balance
	database.DB.Model(&profile).Update("balance", profile.Balance-course.Price)

	// 2. Create Transaction Record
	transaction := models.Transaction{
		ID:        uuid.New(),
		UserID:    userID,
		Amount:    course.Price,
		Type:      "payment",
		Status:    "success",
		Reference: "Pembelian Kursus: " + course.Title,
	}
	database.DB.Create(&transaction)

	// 3. Create/Update Enrollment to Active
	var enrollment models.Enrollment
	if err := database.DB.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		enrollment = models.Enrollment{
			ID:       uuid.New(),
			UserID:   userID,
			CourseID: courseID,
			Status:   "active",
		}
		database.DB.Create(&enrollment)
	} else {
		database.DB.Model(&enrollment).Update("status", "active")
	}

	return c.JSON(fiber.Map{"message": "Pembelian berhasil menggunakan saldo", "balance": profile.Balance - course.Price})
}

// --- Admin Wallet Handlers ---

func GetAdminWalletStats(c *fiber.Ctx) error {
	var totalRevenue float64
	row := database.DB.Table("transactions").Where("status = ? AND type = ?", "success", "payment").Select("COALESCE(sum(amount), 0)").Row()
	row.Scan(&totalRevenue)

	// Join with profile to get display name
	type PendingWithUser struct {
		models.Transaction
		DisplayName string `json:"display_name"`
		Email       string `json:"email"`
	}
	var results []PendingWithUser
	database.DB.Table("transactions").
		Select("transactions.*, profiles.display_name, profiles.email").
		Joins("left join profiles on profiles.user_id = transactions.user_id").
		Where("transactions.status = ? AND transactions.type = ?", "pending", "topup").
		Find(&results)

	return c.JSON(fiber.Map{
		"total_revenue":   totalRevenue,
		"pending_topups": results,
	})
}

func ApproveTopUp(c *fiber.Ctx) error {
	txID := c.Params("id")
	
	var transaction models.Transaction
	if err := database.DB.Where("id = ?", txID).First(&transaction).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Transaksi tidak ditemukan"})
	}

	// GUARD: Prevent double approval
	if transaction.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "Transaksi ini sudah diproses atau dibatalkan"})
	}

	// 1. Update Transaction Status
	database.DB.Model(&transaction).Update("status", "success")

	// 2. Increase User Balance
	var profile models.Profile
	if err := database.DB.Where("user_id = ?", transaction.UserID).First(&profile).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Profil user tidak ditemukan"})
	}
	
	newBalance := profile.Balance + transaction.Amount
	database.DB.Model(&profile).Update("balance", newBalance)

	return c.JSON(fiber.Map{"message": "Top up disetujui, saldo berhasil ditambahkan", "new_balance": newBalance})
}

func RejectTopUp(c *fiber.Ctx) error {
	txID := c.Params("id")
	
	var transaction models.Transaction
	if err := database.DB.Where("id = ?", txID).First(&transaction).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Transaksi tidak ditemukan"})
	}

	if transaction.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "Transaksi sudah diproses sebelumnya"})
	}

	// Update status to failed
	database.DB.Model(&transaction).Update("status", "failed")

	return c.JSON(fiber.Map{"message": "Top up berhasil ditolak"})
}
