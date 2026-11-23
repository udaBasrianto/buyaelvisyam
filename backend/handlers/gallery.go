package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ImageUsage struct {
	Type  string `json:"type"`
	Title string `json:"title"`
	ID    string `json:"id"`
	Link  string `json:"link"`
}

type GalleryItem struct {
	ID          uuid.UUID    `json:"id"`
	URL         string       `json:"url"`
	Filename    string       `json:"filename"`
	MimeType    string       `json:"mime_type"`
	SizeBytes   int64        `json:"size_bytes"`
	SizeHuman   string       `json:"size_human"`
	Width       int          `json:"width"`
	Height      int          `json:"height"`
	CreatedAt   time.Time    `json:"created_at"`
	IsOptimized bool         `json:"is_optimized"`
	UsedCount   int          `json:"used_count"`
	UsedIn      []ImageUsage `json:"used_in"`
}

func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

func getImageDimensions(filePath string) (int, int) {
	f, err := os.Open(filePath)
	if err != nil {
		return 0, 0
	}
	defer f.Close()

	cfg, _, err := image.DecodeConfig(f)
	if err != nil {
		return 0, 0
	}
	return cfg.Width, cfg.Height
}

// CompressImageFile compresses image, resizes if > maxDim, and saves with optimized quality
func CompressImageFile(filePath string, maxDim int, quality int) (int64, int64, error) {
	fi, err := os.Stat(filePath)
	if err != nil {
		return 0, 0, err
	}
	origSize := fi.Size()

	ext := strings.ToLower(filepath.Ext(filePath))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return origSize, origSize, nil
	}

	src, err := imaging.Open(filePath, imaging.AutoOrientation(true))
	if err != nil {
		return origSize, origSize, err
	}

	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	var target image.Image = src
	if (width > maxDim || height > maxDim) && maxDim > 0 {
		target = imaging.Fit(src, maxDim, maxDim, imaging.Lanczos)
	}

	tempPath := filePath + ".tmp_opt"
	var saveErr error
	if ext == ".png" {
		saveErr = imaging.Save(target, tempPath, imaging.PNGCompressionLevel(png.BestCompression))
	} else {
		saveErr = imaging.Save(target, tempPath, imaging.JPEGQuality(quality))
	}

	if saveErr != nil {
		_ = os.Remove(tempPath)
		return origSize, origSize, saveErr
	}

	tempFi, err := os.Stat(tempPath)
	if err != nil {
		_ = os.Remove(tempPath)
		return origSize, origSize, err
	}

	// Only replace if size was actually reduced
	if tempFi.Size() < origSize {
		if err := os.Rename(tempPath, filePath); err != nil {
			_ = os.Remove(tempPath)
			return origSize, origSize, err
		}
		return origSize, tempFi.Size(), nil
	}

	_ = os.Remove(tempPath)
	return origSize, origSize, nil
}

// SyncDiskUploadsToDB scans ./uploads and syncs any missing files into upload_assets table
func SyncDiskUploadsToDB() {
	db := database.DB
	files, err := os.ReadDir("./uploads")
	if err == nil {
		for _, f := range files {
			if f.IsDir() {
				continue
			}
			name := f.Name()
			ext := strings.ToLower(filepath.Ext(name))
			if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" && ext != ".svg" {
				continue
			}

			url := fmt.Sprintf("/uploads/%s", name)
			var count int64
			db.Model(&models.UploadAsset{}).Where("url = ?", url).Count(&count)
			if count == 0 {
				info, err := f.Info()
				if err != nil {
					continue
				}
				mime := "image/jpeg"
				switch ext {
				case ".png":
					mime = "image/png"
				case ".webp":
					mime = "image/webp"
				case ".gif":
					mime = "image/gif"
				case ".svg":
					mime = "image/svg+xml"
				}

				asset := models.UploadAsset{
					ID:         uuid.New(),
					URL:        url,
					Filename:   name,
					MimeType:   mime,
					SizeBytes:  info.Size(),
					UploaderID: uuid.Nil,
					CreatedAt:  info.ModTime(),
				}
				db.Create(&asset)
			}
		}
	}

	// Also index any articles cover_image not yet in upload_assets
	var artCovers []string
	db.Model(&models.Article{}).Where("cover_image != '' AND cover_image IS NOT NULL").Pluck("cover_image", &artCovers)
	for _, cover := range artCovers {
		cleanUrl := strings.TrimSpace(cover)
		if !strings.HasPrefix(cleanUrl, "/uploads/") {
			continue
		}
		var count int64
		db.Model(&models.UploadAsset{}).Where("url = ?", cleanUrl).Count(&count)
		if count == 0 {
			baseName := filepath.Base(cleanUrl)
			diskPath := filepath.Join("./uploads", baseName)
			var size int64 = 0
			var modTime time.Time = time.Now()
			if fi, err := os.Stat(diskPath); err == nil {
				size = fi.Size()
				modTime = fi.ModTime()
			}
			ext := strings.ToLower(filepath.Ext(baseName))
			mime := "image/jpeg"
			if ext == ".png" {
				mime = "image/png"
			} else if ext == ".webp" {
				mime = "image/webp"
			}
			asset := models.UploadAsset{
				ID:         uuid.New(),
				URL:        cleanUrl,
				Filename:   baseName,
				MimeType:   mime,
				SizeBytes:  size,
				UploaderID: uuid.Nil,
				CreatedAt:  modTime,
			}
			db.Create(&asset)
		}
	}
}

// GetGallery returns all images in the application with usage tracking and compression status
func GetGallery(c *fiber.Ctx) error {
	db := database.DB

	// Sync any loose files on disk first
	SyncDiskUploadsToDB()

	q := strings.TrimSpace(c.Query("q"))
	filter := strings.TrimSpace(c.Query("filter")) // "all", "uncompressed", "used", "unused"
	sortBy := strings.TrimSpace(c.Query("sort", "newest")) // "newest", "largest", "smallest", "oldest"

	var assets []models.UploadAsset
	query := db.Model(&models.UploadAsset{})

	if q != "" {
		like := "%" + q + "%"
		query = query.Where("url ILIKE ? OR filename ILIKE ?", like, like)
	}

	switch sortBy {
	case "largest":
		query = query.Order("size_bytes desc")
	case "smallest":
		query = query.Order("size_bytes asc")
	case "oldest":
		query = query.Order("created_at asc")
	default:
		query = query.Order("created_at desc")
	}

	if err := query.Find(&assets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data galeri"})
	}

	// Pre-load usage map across articles, products, popups
	type ArtRow struct {
		ID         uuid.UUID
		Title      string
		Slug       string
		CoverImage string
		Content    string
	}
	var arts []ArtRow
	db.Model(&models.Article{}).Select("id, title, slug, cover_image, content").Find(&arts)

	type ProdRow struct {
		ID       uuid.UUID
		Name     string
		Slug     string
		ImageURL string
	}
	var prods []ProdRow
	db.Model(&models.Product{}).Select("id, name, slug, image_url").Find(&prods)

	type PopupRow struct {
		ID       uuid.UUID
		Title    string
		ImageURL string
	}
	var pops []PopupRow
	db.Model(&models.PopupBanner{}).Select("id, title, image_url").Find(&pops)

	var settings models.SiteSettings
	db.First(&settings)

	var items []GalleryItem
	var totalSizeBytes int64
	var uncompressedCount int
	var usedCount int

	for _, a := range assets {
		// Verify file actually exists and get real size on disk
		diskPath := filepath.Join("./uploads", filepath.Base(a.URL))
		var realSize int64 = a.SizeBytes
		var width, height int
		if fi, err := os.Stat(diskPath); err == nil {
			realSize = fi.Size()
			if realSize != a.SizeBytes {
				a.SizeBytes = realSize
				db.Model(&models.UploadAsset{}).Where("id = ?", a.ID).Update("size_bytes", realSize)
			}
			width, height = getImageDimensions(diskPath)
		}

		totalSizeBytes += realSize
		isOpt := realSize < 250*1024 // Considered well optimized if under 250KB
		if !isOpt {
			uncompressedCount++
		}

		// Find usage
		var usedIn []ImageUsage
		for _, art := range arts {
			if art.CoverImage == a.URL || (art.CoverImage != "" && strings.Contains(art.CoverImage, a.Filename)) {
				usedIn = append(usedIn, ImageUsage{
					Type:  "article_cover",
					Title: fmt.Sprintf("Cover: %s", art.Title),
					ID:    art.ID.String(),
					Link:  fmt.Sprintf("/%s", art.Slug),
				})
			} else if strings.Contains(art.Content, a.URL) || strings.Contains(art.Content, a.Filename) {
				usedIn = append(usedIn, ImageUsage{
					Type:  "article_content",
					Title: fmt.Sprintf("Konten: %s", art.Title),
					ID:    art.ID.String(),
					Link:  fmt.Sprintf("/%s", art.Slug),
				})
			}
		}

		for _, p := range prods {
			if p.ImageURL == a.URL || strings.Contains(p.ImageURL, a.Filename) {
				usedIn = append(usedIn, ImageUsage{
					Type:  "product",
					Title: fmt.Sprintf("Produk: %s", p.Name),
					ID:    p.ID.String(),
					Link:  fmt.Sprintf("/produk/%s", p.Slug),
				})
			}
		}

		for _, pop := range pops {
			if pop.ImageURL == a.URL || strings.Contains(pop.ImageURL, a.Filename) {
				usedIn = append(usedIn, ImageUsage{
					Type:  "popup",
					Title: fmt.Sprintf("Popup: %s", pop.Title),
					ID:    pop.ID.String(),
					Link:  "/admin/popups",
				})
			}
		}

		if settings.LogoURL == a.URL {
			usedIn = append(usedIn, ImageUsage{
				Type:  "settings",
				Title: "Logo Website",
				ID:    "logo",
				Link:  "/admin/settings",
			})
		}

		isUsed := len(usedIn) > 0
		if isUsed {
			usedCount++
		}

		// Apply client filter
		if filter == "uncompressed" && isOpt {
			continue
		}
		if filter == "used" && !isUsed {
			continue
		}
		if filter == "unused" && isUsed {
			continue
		}

		items = append(items, GalleryItem{
			ID:          a.ID,
			URL:         a.URL,
			Filename:    a.Filename,
			MimeType:    a.MimeType,
			SizeBytes:   realSize,
			SizeHuman:   formatBytes(realSize),
			Width:       width,
			Height:      height,
			CreatedAt:   a.CreatedAt,
			IsOptimized: isOpt,
			UsedCount:   len(usedIn),
			UsedIn:      usedIn,
		})
	}

	return c.JSON(fiber.Map{
		"items": items,
		"stats": fiber.Map{
			"total_images":       len(assets),
			"total_size_bytes":   totalSizeBytes,
			"total_size_human":   formatBytes(totalSizeBytes),
			"uncompressed_count": uncompressedCount,
			"used_count":         usedCount,
			"unused_count":       len(assets) - usedCount,
		},
	})
}

// CompressSingleGalleryAsset compresses a single image by asset ID or filename
func CompressSingleGalleryAsset(c *fiber.Ctx) error {
	idStr := c.Params("id")
	db := database.DB

	var asset models.UploadAsset
	if err := db.Where("id = ? OR filename = ?", idStr, idStr).First(&asset).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Gambar tidak ditemukan"})
	}

	filePath := filepath.Join("./uploads", filepath.Base(asset.URL))
	origSize, newSize, err := CompressImageFile(filePath, 1600, 82)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": fmt.Sprintf("Gagal mengompres gambar: %v", err)})
	}

	asset.SizeBytes = newSize
	db.Model(&asset).Update("size_bytes", newSize)

	savedBytes := origSize - newSize
	savedPercent := 0.0
	if origSize > 0 {
		savedPercent = (float64(savedBytes) / float64(origSize)) * 100
	}

	return c.JSON(fiber.Map{
		"message":       "Gambar berhasil dikompres",
		"original_size": formatBytes(origSize),
		"new_size":      formatBytes(newSize),
		"saved_bytes":   savedBytes,
		"saved_human":   formatBytes(savedBytes),
		"saved_percent": fmt.Sprintf("%.1f%%", savedPercent),
	})
}

// CompressAllGallery compresses all images in ./uploads that exceed 180KB or 1600px
func CompressAllGallery(c *fiber.Ctx) error {
	db := database.DB
	files, err := os.ReadDir("./uploads")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membaca direktori uploads"})
	}

	var processedCount int
	var totalSavedBytes int64
	var skippedCount int

	for _, f := range files {
		if f.IsDir() {
			continue
		}
		name := f.Name()
		ext := strings.ToLower(filepath.Ext(name))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			skippedCount++
			continue
		}

		filePath := filepath.Join("./uploads", name)
		fi, err := f.Info()
		if err != nil {
			continue
		}

		// Only compress if file is larger than 180KB
		if fi.Size() < 180*1024 {
			skippedCount++
			continue
		}

		origSize, newSize, err := CompressImageFile(filePath, 1600, 82)
		if err == nil && newSize < origSize {
			diff := origSize - newSize
			totalSavedBytes += diff
			processedCount++

			// Update in DB
			url := fmt.Sprintf("/uploads/%s", name)
			db.Model(&models.UploadAsset{}).Where("url = ?", url).Update("size_bytes", newSize)
		} else {
			skippedCount++
		}
	}

	return c.JSON(fiber.Map{
		"message":           fmt.Sprintf("Berhasil mengompres %d gambar", processedCount),
		"processed_count":   processedCount,
		"skipped_count":     skippedCount,
		"total_saved_bytes": totalSavedBytes,
		"total_saved_human": formatBytes(totalSavedBytes),
	})
}

// DeleteGalleryAsset removes an image from uploads/ and database
func DeleteGalleryAsset(c *fiber.Ctx) error {
	idStr := c.Params("id")
	db := database.DB

	var asset models.UploadAsset
	if err := db.Where("id = ? OR filename = ?", idStr, idStr).First(&asset).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Gambar tidak ditemukan"})
	}

	filePath := filepath.Join("./uploads", filepath.Base(asset.URL))
	_ = os.Remove(filePath)
	_ = db.Delete(&asset)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Gambar berhasil dihapus dari server",
	})
}


// BulkDeleteGalleryAssets removes multiple images permanently from uploads/ and database
func BulkDeleteGalleryAssets(c *fiber.Ctx) error {
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Daftar ID gambar tidak valid"})
	}

	db := database.DB
	deletedCount := 0
	var freedBytes int64

	for _, idStr := range req.IDs {
		var asset models.UploadAsset
		if err := db.Where("id = ? OR filename = ?", idStr, idStr).First(&asset).Error; err == nil {
			filePath := filepath.Join("./uploads", filepath.Base(asset.URL))
			if fi, err := os.Stat(filePath); err == nil {
				freedBytes += fi.Size()
			} else {
				freedBytes += asset.SizeBytes
			}
			_ = os.Remove(filePath)
			_ = db.Delete(&asset)
			deletedCount++
		}
	}

	return c.JSON(fiber.Map{
		"status":        "success",
		"message":       fmt.Sprintf("%d gambar berhasil dihapus secara permanen (%s ruang dibersihkan)", deletedCount, formatBytes(freedBytes)),
		"deleted_count": deletedCount,
		"freed_bytes":   freedBytes,
		"freed_human":   formatBytes(freedBytes),
	})
}
