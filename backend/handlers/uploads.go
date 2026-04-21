package handlers

import (
	"fmt"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Failed to get image file"})
	}

	// generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)
	
	// Create uploads dir if not exists. We already did `mkdir uploads`
	savePath := fmt.Sprintf("./uploads/%s", filename)
	
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
	}

	// Use a relative path so the frontend/browser determines protocol (http vs https)
	publicURL := fmt.Sprintf("/uploads/%s", filename)

	return c.JSON(fiber.Map{
		"url": publicURL,
	})
}
