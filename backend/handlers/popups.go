package handlers

import (
	"errors"
	"time"

	"backend/database"
	"backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetActivePopup mengembalikan popup aktif terkini untuk client (Web / Android).
// [Metodologi: codebase-design] Deep Module: Client cukup memanggil 1 endpoint ringkas ini.
// Semua evaluasi jadwal (start_at, end_at, is_active, platform) diisolasi di backend.
func GetActivePopup(c *fiber.Ctx) error {
	db := database.DB
	now := time.Now()
	platform := c.Query("platform", "web")

	query := db.Where("is_active = ?", true).
		Where("(start_at IS NULL OR start_at <= ?)", now).
		Where("(end_at IS NULL OR end_at >= ?)", now)

	if platform != "" && platform != "all" {
		query = query.Where("(target_platform = 'all' OR target_platform = ?)", platform)
	}

	var popup models.PopupBanner
	if err := query.Order("created_at desc").First(&popup).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(fiber.Map{
				"status": "success",
				"data":   nil,
			})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil popup aktif"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   popup,
	})
}

// GetPopups mengembalikan seluruh daftar popup untuk manajemen di Admin Panel.
func GetPopups(c *fiber.Ctx) error {
	db := database.DB
	var popups []models.PopupBanner

	if err := db.Order("created_at desc").Find(&popups).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat daftar popup"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   popups,
	})
}

// CreatePopup menambahkan popup baru oleh Admin.
func CreatePopup(c *fiber.Ctx) error {
	var payload struct {
		Title            string     `json:"title"`
		Description      string     `json:"description"`
		ImageURL         string     `json:"image_url"`
		ActionURL        string     `json:"action_url"`
		ButtonText       string     `json:"button_text"`
		IsActive         *bool      `json:"is_active"`
		StartAt          *time.Time `json:"start_at"`
		EndAt            *time.Time `json:"end_at"`
		TargetPlatform   string     `json:"target_platform"`
		DisplayFrequency string     `json:"display_frequency"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data tidak valid"})
	}

	if payload.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Judul popup wajib diisi"})
	}

	btnText := payload.ButtonText
	if btnText == "" {
		btnText = "Tutup"
	}

	platform := payload.TargetPlatform
	if platform == "" {
		platform = "all"
	}

	freq := payload.DisplayFrequency
	if freq == "" {
		freq = "once_forever"
	}

	isActive := true
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}

	popup := models.PopupBanner{
		Title:            payload.Title,
		Description:      payload.Description,
		ImageURL:         payload.ImageURL,
		ActionURL:        payload.ActionURL,
		ButtonText:       btnText,
		IsActive:         isActive,
		StartAt:          payload.StartAt,
		EndAt:            payload.EndAt,
		TargetPlatform:   platform,
		DisplayFrequency: freq,
	}

	db := database.DB
	if err := db.Create(&popup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan popup"})
	}

	return c.Status(201).JSON(fiber.Map{
		"status":  "success",
		"message": "Popup berhasil dibuat",
		"data":    popup,
	})
}

// UpdatePopup memperbarui popup oleh Admin.
func UpdatePopup(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	var popup models.PopupBanner
	if err := db.Where("id = ?", id).First(&popup).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Popup tidak ditemukan"})
	}

	var payload struct {
		Title            string     `json:"title"`
		Description      string     `json:"description"`
		ImageURL         string     `json:"image_url"`
		ActionURL        string     `json:"action_url"`
		ButtonText       string     `json:"button_text"`
		IsActive         *bool      `json:"is_active"`
		StartAt          *time.Time `json:"start_at"`
		EndAt            *time.Time `json:"end_at"`
		TargetPlatform   string     `json:"target_platform"`
		DisplayFrequency string     `json:"display_frequency"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data tidak valid"})
	}

	if payload.Title != "" {
		popup.Title = payload.Title
	}
	popup.Description = payload.Description
	popup.ImageURL = payload.ImageURL
	popup.ActionURL = payload.ActionURL
	if payload.ButtonText != "" {
		popup.ButtonText = payload.ButtonText
	}
	if payload.TargetPlatform != "" {
		popup.TargetPlatform = payload.TargetPlatform
	}
	if payload.DisplayFrequency != "" {
		popup.DisplayFrequency = payload.DisplayFrequency
	}
	if payload.IsActive != nil {
		popup.IsActive = *payload.IsActive
	}
	popup.StartAt = payload.StartAt
	popup.EndAt = payload.EndAt

	if err := db.Save(&popup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui popup"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Popup berhasil diperbarui",
		"data":    popup,
	})
}

// DeletePopup menghapus popup oleh Admin.
func DeletePopup(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	var popup models.PopupBanner
	if err := db.Where("id = ?", id).First(&popup).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Popup tidak ditemukan"})
	}

	if err := db.Delete(&popup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus popup"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Popup berhasil dihapus",
	})
}

// TogglePopupActive mengaktifkan atau menonaktifkan status popup secara cepat.
func TogglePopupActive(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	var popup models.PopupBanner
	if err := db.Where("id = ?", id).First(&popup).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Popup tidak ditemukan"})
	}

	popup.IsActive = !popup.IsActive
	if err := db.Save(&popup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengubah status aktif popup"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Status popup berhasil diperbarui",
		"data":    popup,
	})
}
