package handlers

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"time"

	"backend/database"
	"backend/models"
	"backend/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	whatsappConfig models.WhatsAppConfig
)

// InitWhatsApp initializes the WhatsApp connection
func InitWhatsApp() error {
	// Check if WhatsApp is enabled
	enabled := os.Getenv("WHATSAPP_ENABLED")
	if enabled != "true" {
		whatsappConfig.Enabled = false
		return nil
	}

	whatsappConfig.Enabled = true
	whatsappConfig.TokenExpiry = 10 // minutes
	whatsappConfig.MaxAttempts = 3
	whatsappConfig.SessionPath = "./whatsapp_session"

	// Create session directory if not exists
	os.MkdirAll(whatsappConfig.SessionPath, 0700)

	// Initialize WhatsApp service
	ws := service.GetWhatsAppService()
	if err := ws.Initialize(); err != nil {
		fmt.Printf("Failed to initialize WhatsApp service: %v\n", err)
		return err
	}

	fmt.Println("WhatsApp service initialized")
	return nil
}

// GenerateToken generates a random 6-digit token
func GenerateToken() string {
	max := big.NewInt(1000000)
	n, _ := rand.Int(rand.Reader, max)
	return fmt.Sprintf("%06d", n.Int64())
}

// RequestWhatsAppToken handles WhatsApp token request for registration
func RequestWhatsAppToken(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp registration is not available",
		})
	}

	type RequestInput struct {
		PhoneNumber string `json:"phone_number"` // Format: 62xxxxxxxxxx
		DisplayName string `json:"display_name"`
	}

	var input RequestInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	// Validate phone number format
	if len(input.PhoneNumber) < 10 || len(input.PhoneNumber) > 15 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid phone number format. Use format: 62xxxxxxxxxx",
		})
	}

	if input.DisplayName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Display name is required",
		})
	}

	db := database.DB

	// Check if phone number already registered
	var existingToken models.WhatsAppToken
	result := db.Where("phone_number = ? AND verified_at IS NOT NULL", input.PhoneNumber).First(&existingToken)
	if result.RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Phone number already registered",
		})
	}

	// Generate token
	token := GenerateToken()
	expiresAt := time.Now().Add(time.Duration(whatsappConfig.TokenExpiry) * time.Minute)

	// Delete old tokens for this phone number
	db.Where("phone_number = ?", input.PhoneNumber).Delete(&models.WhatsAppToken{})

	// Create new token record
	whatsappToken := models.WhatsAppToken{
		ID:           uuid.New().String(),
		PhoneNumber:  input.PhoneNumber,
		Token:        token,
		CreatedAt:    time.Now(),
		ExpiresAt:    expiresAt,
		AttemptsCount: 0,
		MaxAttempts:  whatsappConfig.MaxAttempts,
	}

	if err := db.Create(&whatsappToken).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	// Send token via WhatsApp (mock for now)
	// In production, integrate actual WhatsApp client to send message
	// Message: "Kode verifikasi BlogUstad Anda: 123456. Berlaku 10 menit."
	err := SendWhatsAppMessage(input.PhoneNumber, token)
	if err != nil {
		// Delete token if message failed to send
		db.Delete(&whatsappToken)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send token via WhatsApp",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Token sent to WhatsApp",
		"expires_at": expiresAt,
	})
}

// SendWhatsAppMessage sends verification token via WhatsApp
func SendWhatsAppMessage(phoneNumber string, token string) error {
	ws := service.GetWhatsAppService()
	message := fmt.Sprintf("Kode verifikasi BlogUstad Anda: %s. Berlaku %d menit.", token, whatsappConfig.TokenExpiry)
	
	// Ensure phone number has @s.whatsapp.net if needed, but SendMessage handles it usually
	// or we just pass the number and let SendMessage handle the suffix.
	// The service expects just the number.
	
	err := ws.SendMessage(phoneNumber, message)
	if err != nil {
		fmt.Printf("Failed to send WhatsApp message to %s: %v\n", phoneNumber, err)
		return err
	}
	
	fmt.Printf("[WhatsApp Message to %s]: %s\n", phoneNumber, message)
	return nil
}

// VerifyWhatsAppToken verifies the token and creates user account
func VerifyWhatsAppToken(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp registration is not available",
		})
	}

	type VerifyInput struct {
		PhoneNumber string `json:"phone_number"`
		Token       string `json:"token"`
		DisplayName string `json:"display_name"`
	}

	var input VerifyInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	db := database.DB

	// Find token record
	var tokenRecord models.WhatsAppToken
	if err := db.Where("phone_number = ? AND verified_at IS NULL", input.PhoneNumber).First(&tokenRecord).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No pending verification found. Request a new token.",
		})
	}

	// Check if token expired
	if time.Now().After(tokenRecord.ExpiresAt) {
		db.Delete(&tokenRecord)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Token expired. Request a new token.",
		})
	}

	// Check attempts
	if tokenRecord.AttemptsCount >= tokenRecord.MaxAttempts {
		db.Delete(&tokenRecord)
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
			"error": "Too many attempts. Request a new token.",
		})
	}

	// Verify token
	if tokenRecord.Token != input.Token {
		tokenRecord.AttemptsCount++
		db.Save(&tokenRecord)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token",
			"attempts_left": tokenRecord.MaxAttempts - tokenRecord.AttemptsCount,
		})
	}

	// Token is valid! Create user account
	userID := uuid.New()
	displayName := input.DisplayName
	if displayName == "" {
		displayName = "User " + input.PhoneNumber[len(input.PhoneNumber)-4:]
	}

	// Email format: phone_number@whatsapp.local
	email := input.PhoneNumber + "@whatsapp.local"

	// Generate temporary password (user should set later)
	tempPassword, _ := bcrypt.GenerateFromPassword([]byte(input.PhoneNumber), 14)

	// Create profile
	profile := models.Profile{
		ID:               uuid.New(),
		UserID:           userID,
		Email:            email,
		Password:         string(tempPassword),
		DisplayName:      displayName,
		WhatsAppNumber:   input.PhoneNumber,
		WhatsAppVerified: true,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := db.Create(&profile).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create account",
		})
	}

	// Create user role (always "pembaca" for WhatsApp registration)
	userRole := models.UserRole{
		ID:     uuid.New(),
		UserID: userID,
		Role:   "pembaca",
	}

	if err := db.Create(&userRole).Error; err != nil {
		// Rollback: delete profile
		db.Delete(&profile)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create account",
		})
	}

	// Mark token as verified
	now := time.Now()
	tokenRecord.VerifiedAt = &now
	db.Save(&tokenRecord)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Account created successfully",
		"user": fiber.Map{
			"id":            profile.ID,
			"email":         profile.Email,
			"display_name":  profile.DisplayName,
			"whatsapp":      profile.WhatsAppNumber,
			"role":          "pembaca",
		},
	})
}

// RequestWhatsAppLogin handles WhatsApp token request for LOGIN
func RequestWhatsAppLogin(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "WhatsApp login is not available"})
	}

	type RequestLoginInput struct {
		PhoneNumber string `json:"phone_number"` // Format: 62xxxxxxxxxx
	}

	var input RequestLoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if len(input.PhoneNumber) < 10 || len(input.PhoneNumber) > 15 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid phone number format."})
	}

	db := database.DB

	// Check if user exists with this WhatsApp Number
	var profile models.Profile
	if err := db.Where("whats_app_number = ?", input.PhoneNumber).First(&profile).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Nomor WhatsApp belum terdaftar. Silakan daftar lebih dulu.",
		})
	}

	token := GenerateToken()
	expiresAt := time.Now().Add(time.Duration(whatsappConfig.TokenExpiry) * time.Minute)

	db.Where("phone_number = ?", input.PhoneNumber).Delete(&models.WhatsAppToken{})

	whatsappToken := models.WhatsAppToken{
		ID:           uuid.New().String(),
		PhoneNumber:  input.PhoneNumber,
		Token:        token,
		CreatedAt:    time.Now(),
		ExpiresAt:    expiresAt,
		AttemptsCount: 0,
		MaxAttempts:  whatsappConfig.MaxAttempts,
	}

	if err := db.Create(&whatsappToken).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	err := SendWhatsAppMessage(input.PhoneNumber, token)
	if err != nil {
		db.Delete(&whatsappToken)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send token via WhatsApp"})
	}

	return c.JSON(fiber.Map{
		"message":    "Token sent to WhatsApp",
		"expires_at": expiresAt,
	})
}

// VerifyWhatsAppLogin verifies the token and LOGS IN the user
func VerifyWhatsAppLogin(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "WhatsApp login is not available"})
	}

	type VerifyLoginInput struct {
		PhoneNumber string `json:"phone_number"`
		Token       string `json:"token"`
	}

	var input VerifyLoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	db := database.DB

	var tokenRecord models.WhatsAppToken
	if err := db.Where("phone_number = ? AND verified_at IS NULL", input.PhoneNumber).First(&tokenRecord).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No pending verification found. Request a new token."})
	}

	if time.Now().After(tokenRecord.ExpiresAt) {
		db.Delete(&tokenRecord)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token expired. Request a new token."})
	}

	if tokenRecord.AttemptsCount >= tokenRecord.MaxAttempts {
		db.Delete(&tokenRecord)
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": "Too many attempts. Request a new token."})
	}

	if tokenRecord.Token != input.Token {
		tokenRecord.AttemptsCount++
		db.Save(&tokenRecord)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token",
			"attempts_left": tokenRecord.MaxAttempts - tokenRecord.AttemptsCount,
		})
	}

	// Token valid! Find user
	var profile models.Profile
	if err := db.Where("whats_app_number = ?", input.PhoneNumber).First(&profile).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	var userRole models.UserRole
	db.Where("user_id = ?", profile.UserID).First(&userRole)

	// Mark token as verified
	now := time.Now()
	tokenRecord.VerifiedAt = &now
	db.Save(&tokenRecord)

	// Generate JWT
	jwtToken := jwt.New(jwt.SigningMethodHS256)
	claims := jwtToken.Claims.(jwt.MapClaims)
	claims["user_id"] = profile.UserID
	claims["email"] = profile.Email
	claims["role"] = userRole.Role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := jwtToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
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

// GetWhatsAppStatus returns WhatsApp client status (admin only)
func GetWhatsAppStatus(c *fiber.Ctx) error {
	ws := service.GetWhatsAppService()
	status := ws.GetStatus()
	
	return c.JSON(fiber.Map{
		"enabled":              whatsappConfig.Enabled,
		"connected":            status["connected"],
		"token_expiry_minutes": whatsappConfig.TokenExpiry,
		"max_attempts":         whatsappConfig.MaxAttempts,
		"phone":                status["phone"],
		"jid":                  status["jid"],
		"qr_code":              ws.GetQRCode(),
	})
}

// ConnectWhatsApp initiates WhatsApp connection with QR code
func ConnectWhatsApp(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp is not enabled",
		})
	}

	ws := service.GetWhatsAppService()
	status := ws.GetStatus()

	if connected, ok := status["connected"].(bool); ok && connected {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "WhatsApp already connected",
		})
	}

	// Use a long-lived background context (2 minutes) for the QR process
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)

	// Cancel is intentionally not called here immediately;
	// it will be called when the goroutine in Connect() finishes or times out.
	_ = cancel

	// Start connection + QR generation asynchronously
	if err := ws.Connect(ctx); err != nil {
		cancel()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Connection failed: %v", err),
		})
	}

	return c.JSON(fiber.Map{
		"message":         "Connection initiated — poll /status for qr_code",
		"status":          "waiting_for_scan",
		"timeout_seconds": 120,
	})
}

// DisconnectWhatsApp disconnects WhatsApp client
func DisconnectWhatsApp(c *fiber.Ctx) error {
	if !whatsappConfig.Enabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp is not enabled",
		})
	}

	ws := service.GetWhatsAppService()
	status := ws.GetStatus()
	
	if !status["connected"].(bool) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "WhatsApp is not connected",
		})
	}

	if err := ws.Disconnect(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to disconnect: %v", err),
		})
	}
	
	return c.JSON(fiber.Map{
		"message": "Disconnected successfully",
	})
}
