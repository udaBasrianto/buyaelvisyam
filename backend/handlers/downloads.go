package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// downloadsFilesDir is the private folder (NOT served statically via /uploads)
// where downloadable files are stored.
const downloadsFilesDir = "downloads_files"

// maxDownloadFileSize = 100 MB
const maxDownloadFileSize = 100 * 1024 * 1024

// allowedDownloadExt lists file extensions admins may upload as downloads.
var allowedDownloadExt = map[string]bool{
	".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true,
	".ppt": true, ".pptx": true, ".txt": true, ".csv": true, ".rtf": true,
	".epub": true, ".zip": true, ".rar": true, ".7z": true, ".tar": true,
	".gz": true, ".mp3": true, ".mp4": true, ".m4a": true,
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

var downloadMimeByExt = map[string]string{
	".pdf": "application/pdf", ".doc": "application/msword",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".xls":  "application/vnd.ms-excel",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".ppt":  "application/vnd.ms-powerpoint",
	".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".txt":  "text/plain", ".csv": "text/csv", ".rtf": "application/rtf",
	".epub": "application/epub+zip", ".zip": "application/zip",
	".rar": "application/vnd.rar", ".7z": "application/x-7z-compressed",
	".tar": "application/x-tar", ".gz": "application/gzip",
	".mp3": "audio/mpeg", ".mp4": "video/mp4", ".m4a": "audio/mp4",
	".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
	".webp": "image/webp", ".gif": "image/gif",
}

func userIDFromToken(c *fiber.Ctx) (uuid.UUID, error) {
	user, ok := c.Locals("user").(*jwt.Token)
	if !ok || user == nil {
		return uuid.Nil, fmt.Errorf("unauthorized")
	}
	claims, ok := user.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, fmt.Errorf("unauthorized")
	}
	idStr, _ := claims["user_id"].(string)
	uid, err := uuid.Parse(strings.TrimSpace(idStr))
	if err != nil {
		return uuid.Nil, fmt.Errorf("unauthorized")
	}
	return uid, nil
}

// saveDownloadFile persists an uploaded file into the private downloads folder.
// Returns originalName, storedPath, fileType, mimeType, size.
func saveDownloadFile(fh *multipart.FileHeader) (string, string, string, string, int64, error) {
	if fh == nil || fh.Size <= 0 {
		return "", "", "", "", 0, fmt.Errorf("file tidak ditemukan")
	}
	if fh.Size > maxDownloadFileSize {
		return "", "", "", "", 0, fmt.Errorf("ukuran file terlalu besar (maks 100MB)")
	}

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if !allowedDownloadExt[ext] {
		return "", "", "", "", 0, fmt.Errorf("format file tidak didukung (pdf/doc/docx/xls/zip/dll)")
	}

	originalName := filepath.Base(fh.Filename)
	storedName := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().UnixMilli(), ext)
	storedPath := filepath.Join(downloadsFilesDir, storedName)

	if err := os.MkdirAll(downloadsFilesDir, 0o755); err != nil {
		return "", "", "", "", 0, fmt.Errorf("gagal menyiapkan folder penyimpanan")
	}
	if err := saveMultipartFile(fh, storedPath); err != nil {
		return "", "", "", "", 0, fmt.Errorf("gagal menyimpan file")
	}

	mime := downloadMimeByExt[ext]
	if mime == "" {
		mime = "application/octet-stream"
	}
	return originalName, storedPath, strings.TrimPrefix(ext, "."), mime, fh.Size, nil
}

func saveMultipartFile(fh *multipart.FileHeader, dst string) error {
	src, err := fh.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = out.ReadFrom(src)
	return err
}

// downloadFileResponse is the JSON shape exposed to clients (internal file_path
// stays server-side so files can only be fetched through the protected endpoint).
type downloadFileResponse struct {
	ID            uuid.UUID `json:"id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	FileName      string    `json:"file_name"`
	FileSize      int64     `json:"file_size"`
	FileType      string    `json:"file_type"`
	DownloadCount int       `json:"download_count"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func toDownloadFileResponse(f models.DownloadFile) downloadFileResponse {
	return downloadFileResponse{
		ID:            f.ID,
		Title:         f.Title,
		Description:   f.Description,
		FileName:      f.FileName,
		FileSize:      f.FileSize,
		FileType:      f.FileType,
		DownloadCount: f.DownloadCount,
		IsActive:      f.IsActive,
		CreatedAt:     f.CreatedAt,
		UpdatedAt:     f.UpdatedAt,
	}
}

// GetPublicDownloads returns active download files for the public downloads page.
func GetPublicDownloads(c *fiber.Ctx) error {
	db := database.DB
	var items []models.DownloadFile
	if err := db.Where("is_active = ?", true).Order("created_at desc").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat data unduhan"})
	}
	out := make([]downloadFileResponse, 0, len(items))
	for _, it := range items {
		out = append(out, toDownloadFileResponse(it))
	}
	return c.JSON(out)
}

// DownloadFileContent streams the file to an authenticated user and records
// one download log (who + when) while incrementing the counter.
func DownloadFileContent(c *fiber.Ctx) error {
	db := database.DB

	userID, err := userIDFromToken(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Login diperlukan untuk mengunduh file"})
	}

	id := c.Params("id")
	var file models.DownloadFile
	if err := db.Where("id = ?", id).First(&file).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}
	if !file.IsActive {
		return c.Status(404).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}

	// Resolve & guard the physical path (never follow ../)
	cleanPath := filepath.Clean(file.FilePath)
	if strings.HasPrefix(cleanPath, "..") || filepath.IsAbs(cleanPath) {
		return c.Status(500).JSON(fiber.Map{"error": "Path file tidak valid"})
	}
	if _, err := os.Stat(cleanPath); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Berkas file sudah tidak ada di server"})
	}

	// Record download log + increment counter atomically
	log := models.DownloadLog{
		DownloadFileID: file.ID,
		UserID:         userID,
		IP:             c.IP(),
		CreatedAt:      time.Now(),
	}
	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&log).Error; err != nil {
			return err
		}
		return tx.Model(&models.DownloadFile{}).
			Where("id = ?", file.ID).
			UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error
	}); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mencatat unduhan"})
	}

	return c.Download(cleanPath, file.FileName)
}

// AdminGetDownloads returns all downloads (active & inactive) for the admin panel.
func AdminGetDownloads(c *fiber.Ctx) error {
	db := database.DB
	var items []models.DownloadFile
	if err := db.Order("created_at desc").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat data unduhan"})
	}
	out := make([]downloadFileResponse, 0, len(items))
	for _, it := range items {
		out = append(out, toDownloadFileResponse(it))
	}
	return c.JSON(fiber.Map{"items": out, "total": len(out)})
}

// AdminCreateDownload creates a download entry with an uploaded file.
func AdminCreateDownload(c *fiber.Ctx) error {
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Form tidak valid"})
	}

	title := strings.TrimSpace(firstFormValue(form, "title"))
	if title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Judul wajib diisi"})
	}
	description := strings.TrimSpace(firstFormValue(form, "description"))

	fileHeaders := form.File["file"]
	if len(fileHeaders) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Pilih file terlebih dahulu"})
	}

	originalName, storedPath, fileType, mime, size, err := saveDownloadFile(fileHeaders[0])
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	isActive := true
	if v := firstFormValue(form, "is_active"); v != "" {
		isActive = v == "true" || v == "1"
	}

	entry := models.DownloadFile{
		Title:       title,
		Description: description,
		FileName:    originalName,
		FilePath:    storedPath,
		FileSize:    size,
		FileType:    fileType,
		MimeType:    mime,
		IsActive:    isActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := database.DB.Create(&entry).Error; err != nil {
		os.Remove(storedPath)
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan data unduhan"})
	}
	return c.JSON(entry)
}

// AdminUpdateDownload updates metadata and optionally replaces the file.
func AdminUpdateDownload(c *fiber.Ctx) error {
	db := database.DB
	id := c.Params("id")

	var entry models.DownloadFile
	if err := db.Where("id = ?", id).First(&entry).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Form tidak valid"})
	}

	if title := strings.TrimSpace(firstFormValue(form, "title")); title != "" {
		entry.Title = title
	}
	if desc := strings.TrimSpace(firstFormValue(form, "description")); desc != "" || len(form.Value["description"]) > 0 {
		entry.Description = desc
	}
	if v := firstFormValue(form, "is_active"); v != "" {
		entry.IsActive = v == "true" || v == "1"
	}

	// Optional file replacement
	var oldPathToRemove string
	if fileHeaders := form.File["file"]; len(fileHeaders) > 0 {
		originalName, storedPath, fileType, mime, size, err := saveDownloadFile(fileHeaders[0])
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		oldPathToRemove = entry.FilePath
		entry.FileName = originalName
		entry.FilePath = storedPath
		entry.FileSize = size
		entry.FileType = fileType
		entry.MimeType = mime
	}

	entry.UpdatedAt = time.Now()
	if err := db.Save(&entry).Error; err != nil {
		// rollback the newly uploaded file if the DB update failed
		if oldPathToRemove != "" {
			os.Remove(filepath.Clean(entry.FilePath))
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan perubahan"})
	}
	// DB update succeeded — now it is safe to remove the replaced file
	if oldPathToRemove != "" {
		os.Remove(filepath.Clean(oldPathToRemove))
	}
	return c.JSON(entry)
}

// AdminDeleteDownload removes a download entry, its logs and its physical file.
func AdminDeleteDownload(c *fiber.Ctx) error {
	db := database.DB
	id := c.Params("id")

	var entry models.DownloadFile
	if err := db.Where("id = ?", id).First(&entry).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}

	if err := db.Delete(&models.DownloadLog{}, "download_file_id = ?", entry.ID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus riwayat unduhan"})
	}
	if err := db.Delete(&entry).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus data"})
	}

	cleanPath := filepath.Clean(entry.FilePath)
	if cleanPath != "." && !filepath.IsAbs(cleanPath) && !strings.HasPrefix(cleanPath, "..") {
		os.Remove(cleanPath)
	}

	return c.JSON(fiber.Map{"message": "File unduhan dihapus"})
}

// AdminGetDownloadLogs returns who downloaded a file and when (latest first).
func AdminGetDownloadLogs(c *fiber.Ctx) error {
	db := database.DB
	id := c.Params("id")

	var file models.DownloadFile
	if err := db.Where("id = ?", id).First(&file).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "File tidak ditemukan"})
	}

	var logs []models.DownloadLog
	if err := db.Where("download_file_id = ?", file.ID).Order("created_at desc").Limit(200).Find(&logs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat riwayat unduhan"})
	}

	// Enrich logs with user identity
	userIDs := make([]uuid.UUID, 0, len(logs))
	seen := map[uuid.UUID]bool{}
	for _, l := range logs {
		if !seen[l.UserID] {
			seen[l.UserID] = true
			userIDs = append(userIDs, l.UserID)
		}
	}
	if len(userIDs) > 0 {
		var profiles []models.Profile
		db.Select("user_id", "email", "display_name").Where("user_id IN ?", userIDs).Find(&profiles)
		profileByID := map[uuid.UUID]models.Profile{}
		for _, p := range profiles {
			profileByID[p.UserID] = p
		}
		for i := range logs {
			if p, ok := profileByID[logs[i].UserID]; ok {
				logs[i].UserDisplayName = p.DisplayName
				logs[i].UserEmail = p.Email
			}
		}
	}

	var total int64
	db.Model(&models.DownloadLog{}).Where("download_file_id = ?", file.ID).Count(&total)

	return c.JSON(fiber.Map{
		"file":  toDownloadFileResponse(file),
		"logs":  logs,
		"total": total,
	})
}

func firstFormValue(form *multipart.Form, key string) string {
	values := form.Value[key]
	if len(values) == 0 {
		return ""
	}
	return values[0]
}
