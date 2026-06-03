package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"time"
)

func GetNavItems(c *fiber.Ctx) error {
	db := database.DB

	var existingCount int64
	db.Model(&models.NavItem{}).
		Where("lower(url) = ?", "/donasi").
		Or("lower(label) = ?", "donasi").
		Count(&existingCount)
	if existingCount == 0 {
		var maxSort int
		db.Model(&models.NavItem{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxSort)

		now := time.Now()
		db.Create(&models.NavItem{
			ID:         uuid.New(),
			Label:      "Donasi",
			URL:        "/donasi",
			SortOrder:  maxSort + 1,
			IsActive:   true,
			IsExternal: false,
			ParentID:   nil,
			CreatedAt:  now,
			UpdatedAt:  now,
		})
	}

	var lmsCount int64
	db.Model(&models.NavItem{}).
		Where("lower(url) = ?", "/lms").
		Or("lower(label) = ?", "akademi").
		Or("lower(label) = ?", "lms").
		Count(&lmsCount)
	if lmsCount == 0 {
		var maxSort int
		db.Model(&models.NavItem{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxSort)

		now := time.Now()
		db.Create(&models.NavItem{
			ID:         uuid.New(),
			Label:      "Akademi",
			URL:        "/lms",
			SortOrder:  maxSort + 1,
			IsActive:   true,
			IsExternal: false,
			ParentID:   nil,
			CreatedAt:  now,
			UpdatedAt:  now,
		})
	}

	var items []models.NavItem
	db.Order("sort_order asc").Find(&items)
	return c.JSON(items)
}

func CreateNavItem(c *fiber.Ctx) error {
	var item models.NavItem
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	database.DB.Create(&item)
	return c.JSON(item)
}

func UpdateNavItem(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.NavItem
	if err := database.DB.Where("id = ?", id).First(&item).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	item.UpdatedAt = time.Now()
	database.DB.Save(&item)
	return c.JSON(item)
}

func DeleteNavItem(c *fiber.Ctx) error {
	id := c.Params("id")
	database.DB.Delete(&models.NavItem{}, "id = ?", id)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

func ReorderNavItems(c *fiber.Ctx) error {
	var ids []string
	if err := c.BodyParser(&ids); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	for i, id := range ids {
		database.DB.Model(&models.NavItem{}).Where("id = ?", id).Update("sort_order", i)
	}
	return c.JSON(fiber.Map{"message": "Reordered"})
}
