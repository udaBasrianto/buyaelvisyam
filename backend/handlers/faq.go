package handlers

import (
	"backend/database"
	"backend/models"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetPublicFAQs returns active FAQ items ordered for the public FAQ page.
func GetPublicFAQs(c *fiber.Ctx) error {
	var items []models.FAQItem
	if err := database.DB.Where("is_active = ?", true).Order("sort_order asc, created_at asc").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat data FAQ"})
	}
	return c.JSON(items)
}

// AdminGetFAQs returns all FAQ items (active & inactive) for the admin panel.
func AdminGetFAQs(c *fiber.Ctx) error {
	var items []models.FAQItem
	if err := database.DB.Order("sort_order asc, created_at asc").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat data FAQ"})
	}
	return c.JSON(fiber.Map{"items": items, "total": len(items)})
}

// AdminCreateFAQ creates a new FAQ item.
func AdminCreateFAQ(c *fiber.Ctx) error {
	var req struct {
		Category string `json:"category"`
		Question string `json:"question"`
		Answer   string `json:"answer"`
		IsActive bool   `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Body tidak valid"})
	}

	req.Category = strings.TrimSpace(req.Category)
	req.Question = strings.TrimSpace(req.Question)
	req.Answer = strings.TrimSpace(req.Answer)
	if req.Question == "" || req.Answer == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Pertanyaan dan jawaban wajib diisi"})
	}
	if req.Category == "" {
		req.Category = "umum"
	}

	var maxSort int
	database.DB.Model(&models.FAQItem{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxSort)

	item := models.FAQItem{
		Category:  req.Category,
		Question:  req.Question,
		Answer:    req.Answer,
		SortOrder: maxSort + 1,
		IsActive:  req.IsActive,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := database.DB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan FAQ"})
	}
	return c.JSON(item)
}

// AdminUpdateFAQ updates an existing FAQ item.
func AdminUpdateFAQ(c *fiber.Ctx) error {
	id := c.Params("id")

	var item models.FAQItem
	if err := database.DB.Where("id = ?", id).First(&item).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "FAQ tidak ditemukan"})
	}

	var req struct {
		Category *string `json:"category"`
		Question *string `json:"question"`
		Answer   *string `json:"answer"`
		IsActive *bool   `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Body tidak valid"})
	}

	if req.Category != nil {
		item.Category = strings.TrimSpace(*req.Category)
	}
	if req.Question != nil {
		item.Question = strings.TrimSpace(*req.Question)
	}
	if req.Answer != nil {
		item.Answer = strings.TrimSpace(*req.Answer)
	}
	if item.Question == "" || item.Answer == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Pertanyaan dan jawaban wajib diisi"})
	}
	if item.Category == "" {
		item.Category = "umum"
	}
	if req.IsActive != nil {
		item.IsActive = *req.IsActive
	}
	item.UpdatedAt = time.Now()

	if err := database.DB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan perubahan"})
	}
	return c.JSON(item)
}

// AdminDeleteFAQ removes a FAQ item.
func AdminDeleteFAQ(c *fiber.Ctx) error {
	id := c.Params("id")

	var item models.FAQItem
	if err := database.DB.Where("id = ?", id).First(&item).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "FAQ tidak ditemukan"})
	}
	if err := database.DB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus FAQ"})
	}
	return c.JSON(fiber.Map{"message": "FAQ dihapus"})
}