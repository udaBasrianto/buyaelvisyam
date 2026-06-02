package handlers

import (
	"backend/database"
	"backend/models"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetUsers(c *fiber.Ctx) error {
	db := database.DB
	var profiles []models.Profile
	
	
	if err := db.Find(&profiles).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch users"})
	}

	// Fetch roles and article counts for each user
	type UserResponse struct {
		models.Profile
		Role     string `json:"role"`
		Articles int    `json:"articles"`
	}

	var response []UserResponse
	for _, p := range profiles {
		var role models.UserRole
		db.Where("user_id = ?", p.UserID).First(&role)

		var count int64
		db.Model(&models.Article{}).Where("author_id = ?", p.UserID).Count(&count)

		response = append(response, UserResponse{
			Profile:  p,
			Role:     role.Role,
			Articles: int(count),
		})
	}

	return c.JSON(response)
}

func CreateUser(c *fiber.Ctx) error {
	type CreateInput struct {
		Email          string `json:"email"`
		Password       string `json:"password"`
		DisplayName    string `json:"display_name"`
		Role           string `json:"role"`
		WhatsAppNumber string `json:"whatsapp_number"`
	}

	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Password = strings.TrimSpace(input.Password)
	input.DisplayName = strings.TrimSpace(input.DisplayName)
	input.Role = strings.TrimSpace(strings.ToLower(input.Role))
	input.WhatsAppNumber = strings.TrimSpace(input.WhatsAppNumber)

	if input.Email == "" || !strings.Contains(input.Email, "@") {
		return c.Status(400).JSON(fiber.Map{"error": "Email tidak valid"})
	}
	if input.DisplayName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nama wajib diisi"})
	}
	if input.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Password wajib diisi"})
	}
	if len(input.Password) < 8 {
		return c.Status(400).JSON(fiber.Map{"error": "Password minimal 8 karakter"})
	}

	if input.Role == "" {
		input.Role = "pembaca"
	}
	if input.Role != "admin" && input.Role != "kontributor" && input.Role != "pembaca" {
		return c.Status(400).JSON(fiber.Map{"error": "Role tidak valid"})
	}

	var whatsapp *string
	if input.WhatsAppNumber != "" {
		normalized, err := normalizeWhatsAppNumber(input.WhatsAppNumber)
		if err != nil {
			if ferr, ok := err.(*fiber.Error); ok {
				return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
			}
			return c.Status(400).JSON(fiber.Map{"error": "Nomor WhatsApp tidak valid"})
		}
		whatsapp = &normalized
	}

	hashed, err := HashPassword(input.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memproses password"})
	}

	db := database.DB
	var created models.Profile

	err = db.Transaction(func(tx *gorm.DB) error {
		userID := uuid.New()
		profile := models.Profile{
			UserID:           userID,
			Email:            input.Email,
			Password:         hashed,
			DisplayName:      input.DisplayName,
			WhatsAppNumber:   whatsapp,
			WhatsAppVerified: false,
		}
		if err := tx.Create(&profile).Error; err != nil {
			return err
		}
		role := models.UserRole{
			UserID: userID,
			Role:   input.Role,
		}
		if err := tx.Create(&role).Error; err != nil {
			return err
		}
		created = profile
		return nil
	})
	if err != nil {
		lower := strings.ToLower(err.Error())
		if strings.Contains(lower, "duplicate") || strings.Contains(lower, "unique") {
			msg := "Data sudah terpakai"
			if strings.Contains(lower, "email") {
				msg = "Email sudah terpakai"
			} else if strings.Contains(lower, "whats") || strings.Contains(lower, "whatsapp") {
				msg = "Nomor WhatsApp sudah terpakai"
			}
			return c.Status(409).JSON(fiber.Map{"error": msg})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat pengguna"})
	}

	return c.JSON(fiber.Map{
		"message": "Pengguna berhasil dibuat",
		"user": fiber.Map{
			"id":              created.UserID,
			"email":           created.Email,
			"display_name":    created.DisplayName,
			"whatsapp_number": created.WhatsAppNumber,
			"role":            input.Role,
		},
	})
}

func UpdateUserRole(c *fiber.Ctx) error {
	id := c.Params("id")
	type RoleInput struct {
		Role string `json:"role"`
	}
	var input RoleInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	role := strings.TrimSpace(strings.ToLower(input.Role))
	if role != "admin" && role != "kontributor" && role != "pembaca" {
		return c.Status(400).JSON(fiber.Map{"error": "Role tidak valid"})
	}

	userID, err := uuid.Parse(strings.TrimSpace(id))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "User ID tidak valid"})
	}

	db := database.DB
	res := db.Model(&models.UserRole{}).Where("user_id = ?", userID).Update("role", role)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update role"})
	}
	if res.RowsAffected == 0 {
		if err := db.Create(&models.UserRole{UserID: userID, Role: role}).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not update role"})
		}
	}

	return c.JSON(fiber.Map{"message": "Role updated successfully"})
}

func UpdateUser(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	userID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "User ID tidak valid"})
	}

	type UpdateInput struct {
		Email          *string `json:"email"`
		DisplayName    *string `json:"display_name"`
		Password       *string `json:"password"`
		WhatsAppNumber *string `json:"whatsapp_number"`
		Role           *string `json:"role"`
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	var updatedProfile models.Profile
	updatedRole := ""

	err = db.Transaction(func(tx *gorm.DB) error {
		var profile models.Profile
		if err := tx.Where("user_id = ?", userID).First(&profile).Error; err != nil {
			return err
		}

		if input.Email != nil {
			email := strings.TrimSpace(strings.ToLower(*input.Email))
			if email == "" || !strings.Contains(email, "@") {
				return fiber.NewError(400, "Email tidak valid")
			}
			profile.Email = email
		}

		if input.DisplayName != nil {
			displayName := strings.TrimSpace(*input.DisplayName)
			if displayName == "" {
				return fiber.NewError(400, "Nama wajib diisi")
			}
			profile.DisplayName = displayName
		}

		if input.Password != nil {
			password := strings.TrimSpace(*input.Password)
			if password == "" {
				return fiber.NewError(400, "Password wajib diisi")
			}
			if len(password) < 8 {
				return fiber.NewError(400, "Password minimal 8 karakter")
			}
			hashed, err := HashPassword(password)
			if err != nil {
				return fiber.NewError(500, "Gagal memproses password")
			}
			profile.Password = hashed
		}

		if input.WhatsAppNumber != nil {
			raw := strings.TrimSpace(*input.WhatsAppNumber)
			if raw == "" {
				if profile.WhatsAppNumber != nil {
					profile.WhatsAppNumber = nil
					profile.WhatsAppVerified = false
				}
			} else {
				normalized, err := normalizeWhatsAppNumber(raw)
				if err != nil {
					if ferr, ok := err.(*fiber.Error); ok {
						return fiber.NewError(ferr.Code, ferr.Message)
					}
					return fiber.NewError(400, "Nomor WhatsApp tidak valid")
				}
				if profile.WhatsAppNumber == nil || *profile.WhatsAppNumber != normalized {
					profile.WhatsAppNumber = &normalized
					profile.WhatsAppVerified = false
				}
			}
		}

		if input.Role != nil {
			role := strings.TrimSpace(strings.ToLower(*input.Role))
			if role != "admin" && role != "kontributor" && role != "pembaca" {
				return fiber.NewError(400, "Role tidak valid")
			}
			updatedRole = role

			var userRole models.UserRole
			if err := tx.Where("user_id = ?", userID).First(&userRole).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					if err := tx.Create(&models.UserRole{UserID: userID, Role: role}).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			} else {
				if err := tx.Model(&userRole).Update("role", role).Error; err != nil {
					return err
				}
			}
		}

		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		var userRole models.UserRole
		if err := tx.Where("user_id = ?", userID).First(&userRole).Error; err == nil {
			updatedRole = userRole.Role
		}

		updatedProfile = profile
		return nil
	})
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		lower := strings.ToLower(err.Error())
		if strings.Contains(lower, "duplicate") || strings.Contains(lower, "unique") {
			msg := "Data sudah terpakai"
			if strings.Contains(lower, "email") {
				msg = "Email sudah terpakai"
			} else if strings.Contains(lower, "whats") || strings.Contains(lower, "whatsapp") {
				msg = "Nomor WhatsApp sudah terpakai"
			}
			return c.Status(409).JSON(fiber.Map{"error": msg})
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "User tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengubah pengguna"})
	}

	return c.JSON(fiber.Map{
		"message": "Pengguna berhasil diubah",
		"user": fiber.Map{
			"id":               updatedProfile.UserID,
			"email":            updatedProfile.Email,
			"display_name":     updatedProfile.DisplayName,
			"whatsapp_number":  updatedProfile.WhatsAppNumber,
			"whatsapp_verified": updatedProfile.WhatsAppVerified,
			"role":             updatedRole,
		},
	})
}

func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	// Delete role and profile
	db.Where("user_id = ?", id).Delete(&models.UserRole{})
	if err := db.Where("user_id = ?", id).Delete(&models.Profile{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete user"})
	}

	return c.JSON(fiber.Map{"message": "User deleted successfully"})
}
