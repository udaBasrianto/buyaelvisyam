package handlers

import (
	"database/sql"
	"log"
	"os"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func GetCategories(c *fiber.Ctx) error {
	db := database.DB
	var categories []models.Category

	// Check if we need to sync from articles (especially useful after imports)
	rows, err := db.Raw(`SELECT category, categories FROM articles`).Rows()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat kategori"})
	}
	defer rows.Close()

	unique := make(map[string]struct{})
	for rows.Next() {
		var category sql.NullString
		var categoriesArr []string
		if err := rows.Scan(&category, pq.Array(&categoriesArr)); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat kategori"})
		}

		if strings.TrimSpace(category.String) != "" {
			unique[strings.TrimSpace(category.String)] = struct{}{}
		}

		for _, name := range categoriesArr {
			name = strings.TrimSpace(name)
			if name == "" {
				continue
			}
			unique[name] = struct{}{}
		}
	}

	for catName := range unique {
		var existing models.Category
		slug := strings.ToLower(strings.ReplaceAll(catName, " ", "-"))

		if err := db.Where("name = ? OR slug = ?", catName, slug).First(&existing).Error; err != nil {
			newCat := models.Category{
				ID:        uuid.New(),
				Name:      catName,
				Slug:      slug,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			db.Create(&newCat)
		}
	}

	db.Order("sort_order asc").Find(&categories)

	// Calculate article count for each category
	for i := range categories {
		var count int64
		db.Model(&models.Article{}).
			Where("status = ? AND (category = ? OR ? = ANY(categories))", "published", categories[i].Name, categories[i].Name).
			Count(&count)
		categories[i].ArticleCount = int(count)
	}

	return c.JSON(categories)
}

func CreateCategory(c *fiber.Ctx) error {
	var category models.Category
	if err := c.BodyParser(&category); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	if err := db.Create(&category).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create category"})
	}

	return c.JSON(category)
}

func UpdateCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var category models.Category

	if err := db.Where("id = ?", id).First(&category).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Category not found"})
	}

	oldName := category.Name

	// Use map to support updating zero values (false, 0, "")
	var updateMap map[string]interface{}
	if err := c.BodyParser(&updateMap); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	// Remove ID from updates to prevent primary key issues
	delete(updateMap, "id")

	if err := db.Model(&category).Updates(updateMap).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Gagal memperbarui kategori",
			"details": err.Error(),
		})
	}

	// If name changed in the update, sync articles
	if newName, ok := updateMap["name"].(string); ok && newName != "" && newName != oldName {
		if err := db.Model(&models.Article{}).Where("category = ?", oldName).Update("category", newName).Error; err != nil {
			// Log error but don't fail the whole request if sync fails
			log.Println("Failed to sync articles after category rename:", err)
		}
		db.Exec("UPDATE articles SET categories = array_replace(categories, ?, ?) WHERE ? = ANY(categories)", oldName, newName, oldName)
	}

	return c.JSON(category)
}

func DeleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var category models.Category

	if err := db.Where("id = ?", id).First(&category).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Category not found"})
	}

	if err := db.Delete(&category).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete category"})
	}

	return c.JSON(fiber.Map{"message": "Category deleted successfully"})
}

func BulkDeleteCategories(c *fiber.Ctx) error {
	type Request struct {
		IDs []string `json:"ids"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(req.IDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No IDs provided"})
	}

	db := database.DB
	if err := db.Where("id IN ?", req.IDs).Delete(&models.Category{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete categories"})
	}

	return c.JSON(fiber.Map{"message": "Categories deleted successfully"})
}

func GetSiteSettings(c *fiber.Ctx) error {
	db := database.DB
	var settings models.SiteSettings
	if err := db.First(&settings).Error; err != nil {
		adminToken := strings.TrimSpace(os.Getenv("ADMIN_TOKEN"))
		if adminToken == "" {
			adminToken = "090124"
		}

		// Initialize if missing
		settings = models.SiteSettings{
			ID:                           uuid.New(),
			SiteName:                     "Buyaelvisyam.id",
			Tagline:                      "Berilmu Sebelum Beramal",
			WhatsAppNotificationsEnabled: false,
			WhatsAppNotifyNewArticle:     true,
			WhatsAppNotifyNewCourse:      true,
			WhatsAppNotifyMaxRecipients:  200,
			HomepageVersion:              "v2",
			ScrollToTopVersion:           "animated",
			AdminToken:                   adminToken,
			AdminSlug:                    "yaakhi",
			HeroTitle:                    "Editors Choice",
			RecentTitle:                  "Recent Stories",
			RecentLimit:                  20,
			SliderOverlayOpacity:         85,
			HomepageSectionOrder:         "hero_slider,prayer_times,categories,editors_choice,feature_bar,recent_stories",
			ProductsMenuLabel:            "Produk",
			ProductsTitle:                "Daftar Produk",
			ProductsSubtitle:             "Lihat produk fisik dan digital yang tersedia.",
			CheckoutWebEnabled:           true,
			CheckoutWhatsAppEnabled:      true,
			CheckoutFlatShippingEnabled:  false,
			CheckoutFlatShippingAmount:   0,
			CheckoutFlatShippingLabel:    "Ongkos Kirim",
			CheckoutPaymentDueHours:      24,
			SliderStyle:                  "v3",
			ShowFeatureBar:               true,
			ShowChatbot:                  true,
			DonationTitle:                "Donasi",
			ShowDonors:                   true,
			UpdatedAt:                    time.Now(),
		}
		db.Create(&settings)
	}

	// Double check admin_slug is not empty (for existing records)
	if settings.AdminSlug == "" {
		settings.AdminSlug = "yaakhi"
		db.Model(&settings).Update("admin_slug", "yaakhi")
	}

	// Hide token from public view, show only to admins
	isAdmin := false
	authHeader := c.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if role, _ := claims["role"].(string); role == "admin" {
					isAdmin = true
				}
			}
		}
	}

	if !isAdmin {
		settings.AdminToken = ""
	}

	envGoogleClientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	if strings.TrimSpace(settings.GoogleClientID) == "" && envGoogleClientID != "" {
		settings.GoogleClientID = envGoogleClientID
		db.Model(&settings).Update("google_client_id", envGoogleClientID)
	}

	return c.JSON(settings)
}

func UpdateSiteSettings(c *fiber.Ctx) error {
	db := database.DB
	var settings models.SiteSettings

	if err := db.First(&settings).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Settings not found"})
	}

	var updatedData models.SiteSettings
	if err := c.BodyParser(&updatedData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	// Gunakan Select("*") agar boolean false (show_chatbot, show_feature_bar, dll)
	// tidak diabaikan oleh GORM sebagai "zero value"
	db.Model(&settings).Select("*").Omit("id", "updated_by", "updated_at", "created_at").Updates(updatedData)

	return c.JSON(settings)
}
