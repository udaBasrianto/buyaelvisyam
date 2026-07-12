package handlers

import (
	"fmt"
	"strings"
	"time"

	"backend/database"
	"backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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
	ImageURL       *string  `json:"image_url"`
	IsActive       *bool    `json:"is_active"`
	SortOrder      *int     `json:"sort_order"`
	DiscountPrice  *float64 `json:"discount_price"`
	IsFlashSale    *bool    `json:"is_flash_sale"`
	FlashSaleStart *string  `json:"flash_sale_start"`
	FlashSaleEnd   *string  `json:"flash_sale_end"`
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
		ImageURL:       imageURL,
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
