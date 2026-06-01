package handlers

import (
	"fmt"
	"net/http"
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

	const maxBytes = 5 * 1024 * 1024
	if file.Size <= 0 || file.Size > maxBytes {
		return c.Status(400).JSON(fiber.Map{"error": "Ukuran file terlalu besar (maks 5MB)"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Gagal membaca file"})
	}
	defer f.Close()

	header := make([]byte, 512)
	n, _ := f.Read(header)
	contentType := http.DetectContentType(header[:n])

	extByType := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
		"image/gif":  ".gif",
	}
	ext := extByType[contentType]
	if ext == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Format file tidak didukung (hanya JPG/PNG/WEBP/GIF)"})
	}

	// generate unique filename
	filename := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)
	
	// Create uploads dir if not exists. We already did `mkdir uploads`
	savePath := fmt.Sprintf("./uploads/%s", filename)
	savePath = filepath.Clean(savePath)
	if strings.Contains(savePath, "..") {
		return c.Status(400).JSON(fiber.Map{"error": "Nama file tidak valid"})
	}
	
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
	}

	// Use a relative path so the frontend/browser determines protocol (http vs https)
	publicURL := fmt.Sprintf("/uploads/%s", filename)

	return c.JSON(fiber.Map{
		"url": publicURL,
	})
}
