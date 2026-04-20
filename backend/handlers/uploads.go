package handlers

import (
	"fmt"
	"path/filepath"
	"strings"
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

	// Assuming backend runs on localhost:4000, we should return a relative or absolute URL
	// For production, this should be configurable. For now:
	host := c.BaseURL()
	// But in fiber BaseURL might be backend's host
	host = strings.Replace(host, "http://127.0.0.1", "http://localhost", 1)
	
	publicURL := fmt.Sprintf("%s/uploads/%s", host, filename)

	return c.JSON(fiber.Map{
		"url": publicURL,
	})
}
