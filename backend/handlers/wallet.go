package handlers

import (
	"backend/database"
	"backend/models"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
	if body.Amount <= 0 || body.Amount > 100000000 {
		return c.Status(400).JSON(fiber.Map{"error": "Nominal top up tidak valid"})
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

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID kursus tidak valid"})
	}

	var course models.Course
	if err := database.DB.Where("id = ?", courseID).First(&course).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kursus tidak ditemukan"})
	}

	var active int64
	database.DB.Model(&models.Enrollment{}).
		Where("user_id = ? AND course_id = ? AND status = ?", userID, courseID, "active").
		Count(&active)
	if active > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Anda sudah terdaftar aktif di kursus ini"})
	}

	errInsufficient := errors.New("insufficient")
	var newBalance float64
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		// Atomic conditional debit: fails when the balance is too low, so parallel
		// requests cannot spend the same balance twice.
		res := tx.Model(&models.Profile{}).
			Where("user_id = ? AND balance >= ?", userID, course.Price).
			UpdateColumn("balance", gorm.Expr("balance - ?", course.Price))
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errInsufficient
		}

		transaction := models.Transaction{
			ID:        uuid.New(),
			UserID:    userID,
			Amount:    course.Price,
			Type:      "payment",
			Status:    "success",
			Reference: "Pembelian Kursus: " + course.Title,
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		var enrollment models.Enrollment
		if err := tx.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
			enrollment = models.Enrollment{
				ID:       uuid.New(),
				UserID:   userID,
				CourseID: courseID,
				Status:   "active",
			}
			if err := tx.Create(&enrollment).Error; err != nil {
				return err
			}
		} else if err := tx.Model(&enrollment).Update("status", "active").Error; err != nil {
			return err
		}

		var profile models.Profile
		if err := tx.Select("balance").Where("user_id = ?", userID).First(&profile).Error; err != nil {
			return err
		}
		newBalance = profile.Balance
		return nil
	})
	if errors.Is(err, errInsufficient) {
		return c.Status(400).JSON(fiber.Map{"error": "Saldo tidak mencukupi"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memproses pembayaran"})
	}

	return c.JSON(fiber.Map{"message": "Pembelian berhasil menggunakan saldo", "balance": newBalance})
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
		"total_revenue":  totalRevenue,
		"pending_topups": results,
	})
}

func ApproveTopUp(c *fiber.Ctx) error {
	txID := c.Params("id")

	var transaction models.Transaction
	if err := database.DB.Where("id = ?", txID).First(&transaction).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Transaksi tidak ditemukan"})
	}
	if transaction.Status != "pending" || transaction.Type != "topup" {
		return c.Status(400).JSON(fiber.Map{"error": "Transaksi ini sudah diproses atau dibatalkan"})
	}

	errProcessed := errors.New("processed")
	errNoProfile := errors.New("no profile")
	var newBalance float64
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Claim the transaction atomically so a double click / parallel request
		// cannot credit the balance twice.
		res := tx.Model(&models.Transaction{}).
			Where("id = ? AND status = ?", transaction.ID, "pending").
			Update("status", "success")
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errProcessed
		}

		res = tx.Model(&models.Profile{}).
			Where("user_id = ?", transaction.UserID).
			UpdateColumn("balance", gorm.Expr("balance + ?", transaction.Amount))
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errNoProfile
		}

		var profile models.Profile
		if err := tx.Select("balance").Where("user_id = ?", transaction.UserID).First(&profile).Error; err != nil {
			return err
		}
		newBalance = profile.Balance
		return nil
	})
	switch {
	case errors.Is(err, errProcessed):
		return c.Status(400).JSON(fiber.Map{"error": "Transaksi ini sudah diproses atau dibatalkan"})
	case errors.Is(err, errNoProfile):
		return c.Status(404).JSON(fiber.Map{"error": "Profil user tidak ditemukan"})
	case err != nil:
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyetujui top up"})
	}

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

	res := database.DB.Model(&models.Transaction{}).
		Where("id = ? AND status = ?", transaction.ID, "pending").
		Update("status", "failed")
	if res.Error != nil || res.RowsAffected == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Transaksi sudah diproses sebelumnya"})
	}

	return c.JSON(fiber.Map{"message": "Top up berhasil ditolak"})
}
