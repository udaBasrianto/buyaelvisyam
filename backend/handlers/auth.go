package handlers

import (
	"os"
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

	db := database.DB

	// Token check disabled as requested
	/*
		var settings models.SiteSettings
		db.First(&settings)
		tokenToCheck := settings.AdminToken
		if tokenToCheck == "" {
			tokenToCheck = "090124"
		}
		if input.Token != tokenToCheck {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token administrator tidak valid!"})
		}
	*/

	var profile models.Profile
	if err := db.Where("email = ?", input.Email).First(&profile).Error; err != nil {
		// Auto-creation for default admin if not exists
		if input.Email == "mas@abd.com" && input.Password == "mas@abd.com" {
			hashedPassword, _ := HashPassword("mas@abd.com")
			uID := uuid.New()
			profile = models.Profile{
				UserID:      uID,
				Email:       "mas@abd.com",
				Password:    hashedPassword,
				DisplayName: "Admin Default",
			}
			db.Create(&profile)
			db.Create(&models.UserRole{UserID: uID, Role: "admin"})
		} else {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		}
	}

	if !CheckPasswordHash(input.Password, profile.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid password"})
	}

	// Get role
	var userRole models.UserRole
	db.Where("user_id = ?", profile.UserID).First(&userRole)

	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = profile.UserID
	claims["email"] = profile.Email
	claims["role"] = userRole.Role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
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

	db := database.DB
	hashedPassword, _ := HashPassword(input.Password)
	userID := uuid.New()

	profile := models.Profile{
		UserID:      userID,
		Email:       input.Email,
		Password:    hashedPassword,
		DisplayName: input.DisplayName,
	}

	if err := db.Create(&profile).Error; err != nil {
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
		hashedPassword, _ := HashPassword(input.Password)
		profile.Password = hashedPassword
	}

	if err := db.Save(&profile).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profil berhasil diperbarui"})
}
