package handlers

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var nonDigits = regexp.MustCompile(`\D+`)

func normalizeWhatsAppNumber(input string) (string, error) {
	raw := strings.TrimSpace(input)
	if raw == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "Nomor WhatsApp wajib diisi")
	}

	digits := nonDigits.ReplaceAllString(raw, "")
	if digits == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "Nomor WhatsApp tidak valid")
	}

	switch {
	case strings.HasPrefix(digits, "62"):
	case strings.HasPrefix(digits, "0"):
		digits = "62" + strings.TrimPrefix(digits, "0")
	case strings.HasPrefix(digits, "8"):
		digits = "62" + digits
	default:
		return "", fiber.NewError(fiber.StatusBadRequest, "Format nomor WhatsApp tidak valid. Gunakan 62xxxxxxxxxx atau 08xxxxxxxxxx")
	}

	if len(digits) < 10 || len(digits) > 15 {
		return "", fiber.NewError(fiber.StatusBadRequest, "Format nomor WhatsApp tidak valid. Gunakan 62xxxxxxxxxx")
	}

	return digits, nil
}

// CheckPasswordHash compare password with hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func validateAdminToken(db any, provided string) error {
	disableAdminToken := strings.EqualFold(strings.TrimSpace(os.Getenv("DISABLE_ADMIN_TOKEN")), "true")
	if disableAdminToken {
		return nil
	}

	var settings models.SiteSettings
	database.DB.First(&settings)
	tokenToCheck := strings.TrimSpace(settings.AdminToken)
	if tokenToCheck == "" {
		tokenToCheck = strings.TrimSpace(os.Getenv("ADMIN_TOKEN"))
	}
	if tokenToCheck == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Token administrator belum dikonfigurasi")
	}

	if subtle.ConstantTimeCompare([]byte(strings.TrimSpace(provided)), []byte(tokenToCheck)) != 1 {
		return fiber.NewError(fiber.StatusUnauthorized, "Token administrator tidak valid!")
	}
	return nil
}

func issueJWT(profile models.Profile, role string) (fiber.Map, error) {
	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret == "" {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "JWT_SECRET belum dikonfigurasi")
	}

	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = profile.UserID.String()
	claims["email"] = profile.Email
	claims["role"] = role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Gagal membuat token")
	}

	return fiber.Map{
		"token": t,
		"user": fiber.Map{
			"id":           profile.UserID,
			"email":        profile.Email,
			"display_name": profile.DisplayName,
			"role":         role,
		},
	}, nil
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
		if err := validateAdminToken(db, input.Token); err != nil {
			if ferr, ok := err.(*fiber.Error); ok {
				return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token administrator tidak valid!"})
		}
	}

	out, err := issueJWT(profile, userRole.Role)
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}
	return c.JSON(out)
}

func GoogleLogin(c *fiber.Ctx) error {
	type Input struct {
		IDToken string `json:"id_token"`
		Token   string `json:"token"`
	}
	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	input.IDToken = strings.TrimSpace(input.IDToken)
	input.Token = strings.TrimSpace(input.Token)
	if input.IDToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id_token wajib diisi"})
	}

	googleClientID := ""
	{
		var settings models.SiteSettings
		database.DB.First(&settings)
		googleClientID = strings.TrimSpace(settings.GoogleClientID)
		if googleClientID == "" {
			googleClientID = strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
		}
	}
	if googleClientID == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Google login belum dikonfigurasi"})
	}

	tokenInfoURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(input.IDToken)
	httpClient := &http.Client{Timeout: 8 * time.Second}
	resp, err := httpClient.Get(tokenInfoURL)
	if err != nil || resp == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token Google tidak valid"})
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token Google tidak valid"})
	}

	type tokenInfo struct {
		Aud           string `json:"aud"`
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	var ti tokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&ti); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token Google tidak valid"})
	}
	if strings.TrimSpace(ti.Aud) != googleClientID {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token Google tidak valid"})
	}
	email := strings.TrimSpace(strings.ToLower(ti.Email))
	if email == "" || !strings.Contains(email, "@") {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Akun Google tidak valid"})
	}
	if strings.TrimSpace(strings.ToLower(ti.EmailVerified)) != "true" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email Google belum terverifikasi"})
	}

	db := database.DB
	var profile models.Profile
	err = db.Where("email = ?", email).First(&profile).Error
	if err != nil {
		userID := uuid.New()
		displayName := strings.TrimSpace(ti.Name)
		if displayName == "" {
			displayName = email
		}
		profile = models.Profile{
			UserID:      userID,
			Email:       email,
			Password:    "",
			DisplayName: displayName,
			AvatarURL:   strings.TrimSpace(ti.Picture),
		}
		if err := db.Create(&profile).Error; err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terdaftar"})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat user"})
		}
		db.Create(&models.UserRole{UserID: userID, Role: "pembaca"})
	} else {
		updates := map[string]any{}
		if strings.TrimSpace(profile.DisplayName) == "" && strings.TrimSpace(ti.Name) != "" {
			updates["display_name"] = strings.TrimSpace(ti.Name)
		}
		if strings.TrimSpace(profile.AvatarURL) == "" && strings.TrimSpace(ti.Picture) != "" {
			updates["avatar_url"] = strings.TrimSpace(ti.Picture)
		}
		if len(updates) > 0 {
			db.Model(&profile).Updates(updates)
			db.Where("user_id = ?", profile.UserID).First(&profile)
		}
	}

	var userRole models.UserRole
	if err := db.Where("user_id = ?", profile.UserID).First(&userRole).Error; err != nil || strings.TrimSpace(userRole.Role) == "" {
		userRole = models.UserRole{UserID: profile.UserID, Role: "pembaca"}
		db.Create(&userRole)
	}

	if userRole.Role == "admin" {
		if err := validateAdminToken(db, input.Token); err != nil {
			if ferr, ok := err.(*fiber.Error); ok {
				return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token administrator tidak valid!"})
		}
	}

	out, err := issueJWT(profile, userRole.Role)
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}
	return c.JSON(out)
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
		"whatsapp":          profile.WhatsAppNumber,
		"whatsapp_number":   profile.WhatsAppNumber,
		"whatsapp_verified": profile.WhatsAppVerified,
	})
}

func UpdateProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr := claims["user_id"].(string)

	type UpdateInput struct {
		DisplayName    string `json:"display_name"`
		Email          string `json:"email"`
		AvatarURL      string `json:"avatar_url"`
		Password       string `json:"password"`
		WhatsAppNumber string `json:"whatsapp_number"`
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
	if strings.TrimSpace(input.WhatsAppNumber) != "" {
		normalized, err := normalizeWhatsAppNumber(input.WhatsAppNumber)
		if err != nil {
			if ferr, ok := err.(*fiber.Error); ok {
				return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nomor WhatsApp tidak valid"})
		}
		if profile.WhatsAppNumber == nil || *profile.WhatsAppNumber != normalized {
			profile.WhatsAppNumber = &normalized
			profile.WhatsAppVerified = false
		}
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
			msg := "Data sudah terpakai"
			lower := strings.ToLower(err.Error())
			if strings.Contains(lower, "email") {
				msg = "Email sudah terpakai"
			} else if strings.Contains(lower, "whats") || strings.Contains(lower, "whatsapp") {
				msg = "Nomor WhatsApp sudah terpakai"
			}
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": msg})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profil berhasil diperbarui"})
}
