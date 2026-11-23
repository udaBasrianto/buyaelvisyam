package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		file, err = c.FormFile("file")
	}
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Failed to get image file"})
	}

	const maxBytes = 10 * 1024 * 1024 // Allow up to 10MB because auto-compress will shrink it down
	if file.Size <= 0 || file.Size > maxBytes {
		return c.Status(400).JSON(fiber.Map{"error": "Ukuran file terlalu besar (maks 10MB)"})
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

	// Create uploads dir if not exists.
	savePath := fmt.Sprintf("./uploads/%s", filename)
	savePath = filepath.Clean(savePath)
	if strings.Contains(savePath, "..") {
		return c.Status(400).JSON(fiber.Map{"error": "Nama file tidak valid"})
	}

	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
	}

	// Auto-compress uploaded image to keep database and disk storage lean and safe
	realSize := file.Size
	if _, newSize, err := CompressImageFile(savePath, 1600, 82); err == nil && newSize > 0 {
		realSize = newSize
	}

	// Use a relative path so the frontend/browser determines protocol (http vs https)
	publicURL := fmt.Sprintf("/uploads/%s", filename)

	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	uploaderID, _ := uuid.Parse(strings.TrimSpace(userIDStr))

	asset := models.UploadAsset{
		ID:         uuid.New(),
		URL:        publicURL,
		Filename:   file.Filename,
		MimeType:   contentType,
		SizeBytes:  realSize,
		UploaderID: uploaderID,
		CreatedAt:  time.Now(),
	}
	database.DB.Create(&asset)

	return c.JSON(fiber.Map{
		"url": publicURL,
	})
}

func AdminListUploadAssets(c *fiber.Ctx) error {
	db := database.DB

	q := strings.TrimSpace(c.Query("q"))
	limit := c.QueryInt("limit", 50)
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := c.QueryInt("offset", 0)
	if offset < 0 {
		offset = 0
	}

	query := db.Model(&models.UploadAsset{})
	if q != "" {
		like := "%" + q + "%"
		query = query.Where("url ILIKE ? OR filename ILIKE ? OR mime_type ILIKE ?", like, like, like)
	}

	var total int64
	query.Count(&total)

	var items []models.UploadAsset
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat media"})
	}

	return c.JSON(fiber.Map{
		"items": items,
		"total": total,
	})
}

func AdminDeleteUploadAsset(c *fiber.Ctx) error {
	idStr := c.Params("id")
	assetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid asset ID"})
	}

	var asset models.UploadAsset
	if err := database.DB.First(&asset, "id = ?", assetID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Aset media tidak ditemukan"})
	}

	// Delete from disk if under /uploads/
	if asset.URL != "" && strings.HasPrefix(asset.URL, "/uploads/") {
		filename := filepath.Base(asset.URL)
		filePath := filepath.Join("./uploads", filename)
		_ = os.Remove(filePath)
	}

	if err := database.DB.Delete(&asset).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus aset"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Aset media berhasil dihapus",
	})
}
