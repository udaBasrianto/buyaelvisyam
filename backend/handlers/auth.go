package handlers

import (
	"crypto/subtle"
	"os"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// CheckPasswordHash compare password with hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func Login(c *fiber.Ctx) error {
	type LoginInput struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Token    string `json:"token"` // Added Admin Token
	}
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Password = strings.TrimSpace(input.Password)
	input.Token = strings.TrimSpace(input.Token)
	if input.Email == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email dan password wajib diisi"})
	}

	db := database.DB

	var profile models.Profile
	if err := db.Where("email = ?", input.Email).First(&profile).Error; err != nil {
		allowBootstrap := strings.EqualFold(strings.TrimSpace(os.Getenv("ALLOW_DEFAULT_ADMIN")), "true")
		if !allowBootstrap {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		}

		var cnt int64
		db.Model(&models.Profile{}).Count(&cnt)
		if cnt != 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		}

		defaultEmail := strings.TrimSpace(strings.ToLower(os.Getenv("DEFAULT_ADMIN_EMAIL")))
		defaultPassword := strings.TrimSpace(os.Getenv("DEFAULT_ADMIN_PASSWORD"))
		if defaultEmail == "" || defaultPassword == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Bootstrap admin belum dikonfigurasi"})
		}
		if input.Email != defaultEmail || input.Password != defaultPassword {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		}

		hashedPassword, err := HashPassword(defaultPassword)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memproses password"})
		}

		uID := uuid.New()
		profile = models.Profile{
			UserID:      uID,
			Email:       defaultEmail,
			Password:    hashedPassword,
			DisplayName: "Admin",
		}
		db.Create(&profile)
		db.Create(&models.UserRole{UserID: uID, Role: "admin"})
	}

	if !CheckPasswordHash(input.Password, profile.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
	}

	// Get role
	var userRole models.UserRole
	db.Where("user_id = ?", profile.UserID).First(&userRole)

	// Validate token only for admin role
	if userRole.Role == "admin" {
		disableAdminToken := strings.EqualFold(strings.TrimSpace(os.Getenv("DISABLE_ADMIN_TOKEN")), "true")
		if disableAdminToken {
			goto signJWT
		}

		var settings models.SiteSettings
		db.First(&settings)
		tokenToCheck := strings.TrimSpace(settings.AdminToken)
		if tokenToCheck == "" || tokenToCheck == "090124" {
			tokenToCheck = strings.TrimSpace(os.Getenv("ADMIN_TOKEN"))
		}
		if tokenToCheck == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token administrator belum dikonfigurasi"})
		}

		if subtle.ConstantTimeCompare([]byte(input.Token), []byte(tokenToCheck)) != 1 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token administrator tidak valid!"})
		}
	}

signJWT:
	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "JWT_SECRET belum dikonfigurasi"})
	}

	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = profile.UserID.String()
	claims["email"] = profile.Email
	claims["role"] = userRole.Role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"token": t,
		"user": fiber.Map{
			"id":           profile.UserID,
			"email":        profile.Email,
			"display_name": profile.DisplayName,
			"role":         userRole.Role,
		},
	})
}

func Register(c *fiber.Ctx) error {
	type RegisterInput struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
	}
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Password = strings.TrimSpace(input.Password)
	input.DisplayName = strings.TrimSpace(input.DisplayName)
	if input.Email == "" || !strings.Contains(input.Email, "@") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email tidak valid"})
	}
	if len(input.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password minimal 8 karakter"})
	}
	if input.DisplayName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nama tampilan wajib diisi"})
	}

	db := database.DB
	hashedPassword, err := HashPassword(input.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memproses password"})
	}
	userID := uuid.New()

	profile := models.Profile{
		UserID:      userID,
		Email:       input.Email,
		Password:    hashedPassword,
		DisplayName: input.DisplayName,
	}

	if err := db.Create(&profile).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terdaftar"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create user"})
	}

	// Default role
	userRole := models.UserRole{
		UserID: userID,
		Role:   "pembaca",
	}
	db.Create(&userRole)

	return c.JSON(fiber.Map{"message": "User created", "user_id": userID})
}

func Me(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr := claims["user_id"].(string)

	var profile models.Profile
	database.DB.Where("user_id = ?", userIDStr).First(&profile)

	var userRole models.UserRole
	database.DB.Where("user_id = ?", profile.UserID).First(&userRole)

	return c.JSON(fiber.Map{
		"id":           profile.UserID,
		"email":        profile.Email,
		"display_name": profile.DisplayName,
		"role":         userRole.Role,
		"avatar_url":   profile.AvatarURL,
		"whatsapp":     profile.WhatsAppNumber,
	})
}

func UpdateProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr := claims["user_id"].(string)

	type UpdateInput struct {
		DisplayName string `json:"display_name"`
		Email       string `json:"email"`
		AvatarURL   string `json:"avatar_url"`
		Password    string `json:"password"`
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	db := database.DB
	var profile models.Profile
	if err := db.Where("user_id = ?", userIDStr).First(&profile).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Profile not found"})
	}

	if input.DisplayName != "" {
		profile.DisplayName = input.DisplayName
	}
	if input.Email != "" {
		profile.Email = input.Email
	}
	if input.AvatarURL != "" {
		profile.AvatarURL = input.AvatarURL
	}
	if input.Password != "" {
		hashedPassword, err := HashPassword(input.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memproses password"})
		}
		profile.Password = hashedPassword
	}

	if err := db.Save(&profile).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terpakai"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profil berhasil diperbarui"})
}
