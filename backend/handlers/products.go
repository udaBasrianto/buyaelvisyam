package handlers

import (
	"fmt"
	"strings"
	"os"
	"path/filepath"
	"time"

	"backend/database"
	"backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type productRequest struct {
	Title          string   `json:"title"`
	Slug           string   `json:"slug"`
	Description    string   `json:"description"`
	ProductType    string   `json:"product_type"`
	Price          *float64 `json:"price"`
	Currency       string   `json:"currency"`
	SKU            string   `json:"sku"`
	Stock          *int     `json:"stock"`
	DigitalFileURL *string  `json:"digital_file_url"`
	DownloadCount  *int     `json:"download_count"`
	ImageURL       *string  `json:"image_url"`
	IsActive       *bool    `json:"is_active"`
	SortOrder      *int     `json:"sort_order"`
	DiscountPrice  *float64  `json:"discount_price"`
	IsFlashSale    *bool     `json:"is_flash_sale"`
	FlashSaleStart *string   `json:"flash_sale_start"`
	FlashSaleEnd   *string   `json:"flash_sale_end"`
	Images         *[]string `json:"images"`
}

func parseTime(s *string) *time.Time {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	formats := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}
	for _, f := range formats {
		if t, err := time.ParseInLocation(f, *s, time.Local); err == nil {
			return &t
		}
	}
	return nil
}

func slugifyProduct(value string) string {
	text := strings.TrimSpace(strings.ToLower(value))
	text = strings.ReplaceAll(text, " ", "-")
	text = strings.ReplaceAll(text, "_", "-")
	text = strings.ReplaceAll(text, "/", "-")
	for strings.Contains(text, "--") {
		text = strings.ReplaceAll(text, "--", "-")
	}
	text = strings.Trim(text, "-")
	if text == "" {
		text = "produk"
	}
	return text
}

func ensureUniqueProductSlug(db *gorm.DB, baseSlug string) (string, error) {
	slug := slugifyProduct(baseSlug)
	if slug == "" {
		slug = "produk"
	}

	var count int64
	if err := db.Model(&models.Product{}).Where("slug = ?", slug).Count(&count).Error; err != nil {
		return "", err
	}
	if count == 0 {
		return slug, nil
	}

	for i := 2; i <= 200; i++ {
		candidate := fmt.Sprintf("%s-%d", slug, i)
		if err := db.Model(&models.Product{}).Where("slug = ?", candidate).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("gagal membuat slug unik")
}

// sanitizeProductForViewer hides the raw digital file location from non-admins so
// paid files cannot be fetched directly.
func sanitizeProductForViewer(p *models.Product, isAdmin bool) {
	p.HasDigitalFile = strings.TrimSpace(p.DigitalFileURL) != ""
	p.IsFreeDownload = p.HasDigitalFile && p.GetActivePrice() <= 0
	if !isAdmin {
		p.DigitalFileURL = ""
	}
}

func GetProducts(c *fiber.Ctx) error {
	db := database.DB
	var products []models.Product
	query := db.Order("sort_order asc").Order("created_at desc")

	active := c.Query("active", "true")
	if active != "all" {
		query = query.Where("is_active = ?", true)
	}

	productType := c.Query("product_type", "")
	if productType != "" {
		query = query.Where("product_type = ?", productType)
	}

	if err := query.Find(&products).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat produk"})
	}

	for i := range products {
		var sold int64
		db.Model(&models.ProductOrderItem{}).
			Joins("JOIN product_orders ON product_orders.id = product_order_items.order_id").
			Where("product_order_items.product_id = ? AND product_orders.status IN ?", products[i].ID, []string{"confirmed", "processed", "completed"}).
			Select("COALESCE(SUM(product_order_items.quantity), 0)").
			Row().Scan(&sold)
		products[i].Sold = int(sold)
	}

	_, role := requestIdentity(c)
	for i := range products {
		sanitizeProductForViewer(&products[i], isAdminRole(role))
	}

	return c.JSON(products)
}

func GetProduct(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Slug produk wajib diisi"})
	}

	db := database.DB
	var product models.Product
	if err := db.Where("slug = ?", slug).Where("is_active = ?", true).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Produk tidak ditemukan"})
	}

	var sold int64
	db.Model(&models.ProductOrderItem{}).
		Joins("JOIN product_orders ON product_orders.id = product_order_items.order_id").
		Where("product_order_items.product_id = ? AND product_orders.status IN ?", product.ID, []string{"confirmed", "processed", "completed"}).
		Select("COALESCE(SUM(product_order_items.quantity), 0)").
		Row().Scan(&sold)
	product.Sold = int(sold)

	_, role := requestIdentity(c)
	sanitizeProductForViewer(&product, isAdminRole(role))

	return c.JSON(product)
}

func CreateProduct(c *fiber.Ctx) error {
	var body productRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if strings.TrimSpace(body.Title) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Judul produk wajib diisi"})
	}

	if body.ProductType != "physical" && body.ProductType != "digital" {
		body.ProductType = "physical"
	}

	slug := strings.TrimSpace(body.Slug)
	if slug == "" {
		slug = body.Title
	}
	generatedSlug, err := ensureUniqueProductSlug(database.DB, slug)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Tidak dapat membuat slug produk"})
	}

	price := 0.0
	if body.Price != nil {
		price = *body.Price
	}

	stock := 0
	if body.Stock != nil {
		stock = *body.Stock
	}

	downloadCount := 0
	if body.DownloadCount != nil {
		downloadCount = *body.DownloadCount
	}

	digitalFileURL := ""
	if body.DigitalFileURL != nil {
		digitalFileURL = *body.DigitalFileURL
	}

	imageURL := ""
	if body.ImageURL != nil {
		imageURL = *body.ImageURL
	}

	discountPrice := 0.0
	if body.DiscountPrice != nil {
		discountPrice = *body.DiscountPrice
	}

	isFlashSale := false
	if body.IsFlashSale != nil {
		isFlashSale = *body.IsFlashSale
	}

	var images []string
	if body.Images != nil {
		images = *body.Images
	}
	if imageURL == "" && len(images) > 0 {
		imageURL = images[0]
	}

	product := models.Product{
		ID:             uuid.New(),
		Title:          body.Title,
		Slug:           generatedSlug,
		Description:    body.Description,
		ProductType:    body.ProductType,
		Price:          price,
		Currency:       body.Currency,
		SKU:            body.SKU,
		Stock:          stock,
		DigitalFileURL: digitalFileURL,
		DownloadCount:  downloadCount,
		ImageURL:       imageURL,
		Images:         images,
		IsActive:       true,
		SortOrder:      0,
		DiscountPrice:  discountPrice,
		IsFlashSale:    isFlashSale,
		FlashSaleStart: parseTime(body.FlashSaleStart),
		FlashSaleEnd:   parseTime(body.FlashSaleEnd),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if body.IsActive != nil {
		product.IsActive = *body.IsActive
	}
	if body.SortOrder != nil {
		product.SortOrder = *body.SortOrder
	}
	if strings.TrimSpace(product.Currency) == "" {
		product.Currency = "IDR"
	}

	if err := database.DB.Create(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan produk"})
	}

	return c.JSON(product)
}

func UpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID produk wajib diisi"})
	}

	var product models.Product
	if err := database.DB.Where("id = ?", id).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Produk tidak ditemukan"})
	}

	var body productRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	updateMap := map[string]interface{}{}
	if strings.TrimSpace(body.Title) != "" {
		updateMap["title"] = body.Title
	}
	if strings.TrimSpace(body.Description) != "" {
		updateMap["description"] = body.Description
	}
	if body.ProductType != "" {
		if body.ProductType != "physical" && body.ProductType != "digital" {
			body.ProductType = "physical"
		}
		updateMap["product_type"] = body.ProductType
	}
	if body.Price != nil {
		updateMap["price"] = *body.Price
	}
	if strings.TrimSpace(body.Currency) != "" {
		updateMap["currency"] = body.Currency
	}
	if strings.TrimSpace(body.SKU) != "" {
		updateMap["sku"] = body.SKU
	}
	if body.Stock != nil {
		updateMap["stock"] = *body.Stock
	}
	if body.DigitalFileURL != nil {
		updateMap["digital_file_url"] = *body.DigitalFileURL
	}
	if body.DownloadCount != nil {
		updateMap["download_count"] = *body.DownloadCount
	}
	if body.ImageURL != nil {
		updateMap["image_url"] = *body.ImageURL
	}
	if body.IsActive != nil {
		updateMap["is_active"] = *body.IsActive
	}
	if body.SortOrder != nil {
		updateMap["sort_order"] = *body.SortOrder
	}
	if body.DiscountPrice != nil {
		updateMap["discount_price"] = *body.DiscountPrice
	}
	if body.IsFlashSale != nil {
		updateMap["is_flash_sale"] = *body.IsFlashSale
	}
	if body.FlashSaleStart != nil {
		updateMap["flash_sale_start"] = parseTime(body.FlashSaleStart)
	}
	if body.FlashSaleEnd != nil {
		updateMap["flash_sale_end"] = parseTime(body.FlashSaleEnd)
	}
	if body.Images != nil {
		updateMap["images"] = pq.StringArray(*body.Images)
		var currentImage string
		if body.ImageURL != nil {
			currentImage = *body.ImageURL
		} else {
			currentImage = product.ImageURL
		}
		if currentImage == "" && len(*body.Images) > 0 {
			updateMap["image_url"] = (*body.Images)[0]
		}
	}

	if strings.TrimSpace(body.Slug) != "" && body.Slug != product.Slug {
		newSlug, err := ensureUniqueProductSlug(database.DB, body.Slug)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Tidak dapat membuat slug produk"})
		}
		updateMap["slug"] = newSlug
	}

	if len(updateMap) == 0 {
		return c.JSON(product)
	}

	updateMap["updated_at"] = time.Now()
	if err := database.DB.Model(&product).Updates(updateMap).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui produk"})
	}

	return c.JSON(product)
}

func DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID produk wajib diisi"})
	}

	if err := database.DB.Where("id = ?", id).Delete(&models.Product{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus produk"})
	}

	return c.JSON(fiber.Map{"message": "Produk dihapus"})
}

// UploadProductDigitalFile handles uploading zip, pdf, and other digital product files
func UploadProductDigitalFile(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		file, err = c.FormFile("digital_file")
	}
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Pilih file digital terlebih dahulu"})
	}

	const maxBytes = 250 * 1024 * 1024 // 250MB
	if file.Size <= 0 || file.Size > maxBytes {
		return c.Status(400).JSON(fiber.Map{"error": "Ukuran file terlalu besar (maksimal 250MB)"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{
		".zip": true, ".rar": true, ".7z": true, ".tar": true, ".gz": true,
		".pdf": true, ".epub": true, ".mobi": true,
		".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true,
		".mp3": true, ".m4a": true, ".wav": true,
		".mp4": true, ".mkv": true,
		".apk": true, ".txt": true,
	}
	if !allowedExts[ext] {
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Format file '%s' tidak didukung. Gunakan ZIP, RAR, 7Z, PDF, EPUB, dll.", ext)})
	}

	dir := "./uploads/digital"
	if err := os.MkdirAll(dir, 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyiapkan direktori penyimpanan"})
	}

	cleanBase := strings.ToLower(filepath.Base(file.Filename))
	cleanBase = strings.ReplaceAll(cleanBase, " ", "-")
	cleanBase = strings.ReplaceAll(cleanBase, "_", "-")
	baseWithoutExt := strings.TrimSuffix(cleanBase, ext)
	if len(baseWithoutExt) > 50 {
		baseWithoutExt = baseWithoutExt[:50]
	}
	filename := fmt.Sprintf("%s-%s%s", baseWithoutExt, uuid.New().String()[:8], ext)
	savePath := filepath.Join(dir, filename)

	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan file digital"})
	}

	publicURL := fmt.Sprintf("/uploads/digital/%s", filename)

	return c.JSON(fiber.Map{
		"url":       publicURL,
		"filename":  file.Filename,
		"size":      file.Size,
		"extension": strings.TrimPrefix(ext, "."),
	})
}

// DownloadProductFile handles downloading a digital product file and atomically increments the download count
func DownloadProductFile(c *fiber.Ctx) error {
	idOrSlug := strings.TrimSpace(c.Params("id"))
	if idOrSlug == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID atau slug produk wajib diisi"})
	}

	db := database.DB
	var product models.Product

	query := db.Where("is_active = ?", true)
	if _, err := uuid.Parse(idOrSlug); err == nil {
		query = query.Where("id = ?", idOrSlug)
	} else {
		query = query.Where("slug = ?", idOrSlug)
	}

	if err := query.First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Produk digital tidak ditemukan"})
	}

	if strings.TrimSpace(product.DigitalFileURL) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Produk ini belum memiliki file digital untuk diunduh"})
	}

	// Paid products: only admins, or holders of a paid order containing this product.
	if product.GetActivePrice() > 0 {
		_, role := requestIdentity(c)
		if !isAdminRole(role) {
			orderToken := strings.TrimSpace(c.Query("order"))
			if orderToken == "" {
				return c.Status(403).JSON(fiber.Map{"error": "Produk berbayar. Silakan selesaikan pembelian untuk mengunduh."})
			}
			var paidCount int64
			db.Model(&models.ProductOrderItem{}).
				Joins("JOIN product_orders ON product_orders.id = product_order_items.order_id").
				Where("product_orders.public_token = ? AND product_orders.payment_status = ? AND product_orders.status <> ? AND product_order_items.product_id = ?",
					orderToken, "paid", "cancelled", product.ID).
				Count(&paidCount)
			if paidCount == 0 {
				return c.Status(403).JSON(fiber.Map{"error": "Pesanan belum lunas atau tidak berisi produk ini."})
			}
		}
	}

	// Atomically increment download_count
	_ = db.Model(&models.Product{}).Where("id = ?", product.ID).
		UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error

	fileURL := strings.TrimSpace(product.DigitalFileURL)

	// Check if local file (/uploads/...)
	if strings.HasPrefix(fileURL, "/uploads/") || strings.HasPrefix(fileURL, "uploads/") {
		relPath := strings.TrimPrefix(fileURL, "/")
		cleanPath := filepath.Clean(relPath)
		if strings.HasPrefix(cleanPath, "..") {
			return c.Status(400).JSON(fiber.Map{"error": "Path file tidak valid"})
		}
		if _, err := os.Stat(cleanPath); err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Berkas file fisik tidak ditemukan di server"})
		}

		downloadName := filepath.Base(cleanPath)
		return c.Download(cleanPath, downloadName)
	}

	// External URL (e.g. Google Drive, Cloudflare R2, CDN)
	return c.Redirect(fileURL, 302)
}
