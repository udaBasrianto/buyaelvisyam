package handlers

import (
	"backend/database"
	"backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetHomepageCategorySections returns all sections ordered by sort_order.
// Public endpoint — used by the homepage to render category feeds.
func GetHomepageCategorySections(c *fiber.Ctx) error {
	db := database.DB
	var sections []models.HomepageCategorySection
	if err := db.Order("sort_order asc, created_at asc").Find(&sections).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat section kategori"})
	}
	return c.JSON(sections)
}

// GetHomepageCategoryFeed returns articles for ALL active sections in one request.
// Response shape: { sections: [ { section: {...}, articles: [...] }, ... ] }
func GetHomepageCategoryFeed(c *fiber.Ctx) error {
	db := database.DB

	var sections []models.HomepageCategorySection
	if err := db.Where("is_active = ?", true).
		Order("sort_order asc, created_at asc").
		Find(&sections).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat section"})
	}

	type SectionWithArticles struct {
		Section  models.HomepageCategorySection `json:"section"`
		Articles []models.Article               `json:"articles"`
	}

	result := make([]SectionWithArticles, 0, len(sections))

	for _, sec := range sections {
		limit := sec.ArticleCount
		if limit <= 0 {
			limit = 4
		}
		if limit > 12 {
			limit = 12
		}

		var articles []models.Article
		db.Where(
			"status = ? AND (category = ? OR ? = ANY(categories))",
			"published", sec.CategoryName, sec.CategoryName,
		).
			Order("published_at desc").
			Limit(limit).
			Find(&articles)

		// Attach author names
		authorIDSet := make(map[uuid.UUID]struct{})
		for i := range articles {
			authorIDSet[articles[i].AuthorID] = struct{}{}
		}
		authorIDs := make([]uuid.UUID, 0, len(authorIDSet))
		for id := range authorIDSet {
			authorIDs = append(authorIDs, id)
		}
		if len(authorIDs) > 0 {
			type AuthorRow struct {
				UserID      uuid.UUID
				DisplayName string
			}
			var rows []AuthorRow
			db.Model(&models.Profile{}).
				Select("user_id, display_name").
				Where("user_id IN ?", authorIDs).
				Find(&rows)
			nameMap := make(map[uuid.UUID]string, len(rows))
			for _, r := range rows {
				nameMap[r.UserID] = r.DisplayName
			}
			for i := range articles {
				if n, ok := nameMap[articles[i].AuthorID]; ok {
					articles[i].AuthorName = n
				} else {
					articles[i].AuthorName = "Ustadz"
				}
			}
		}

		result = append(result, SectionWithArticles{
			Section:  sec,
			Articles: articles,
		})
	}

	return c.JSON(fiber.Map{"sections": result})
}

// CreateHomepageCategorySection creates a new section.
func CreateHomepageCategorySection(c *fiber.Ctx) error {
	db := database.DB

	var input struct {
		CategoryName string `json:"category_name"`
		CategorySlug string `json:"category_slug"`
		CustomTitle  string `json:"custom_title"`
		ArticleCount int    `json:"article_count"`
		Layout       string `json:"layout"`
		IsActive     *bool  `json:"is_active"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	if input.CategoryName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "category_name wajib diisi"})
	}

	// Default values
	if input.ArticleCount <= 0 {
		input.ArticleCount = 4
	}
	if input.Layout == "" {
		input.Layout = "grid"
	}
	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	// Auto sort_order = max + 1
	var maxOrder int
	db.Model(&models.HomepageCategorySection{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxOrder)

	sec := models.HomepageCategorySection{
		CategoryName: input.CategoryName,
		CategorySlug: input.CategorySlug,
		CustomTitle:  input.CustomTitle,
		ArticleCount: input.ArticleCount,
		Layout:       input.Layout,
		IsActive:     isActive,
		SortOrder:    maxOrder + 1,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := db.Create(&sec).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat section", "details": err.Error()})
	}
	return c.Status(201).JSON(sec)
}

// UpdateHomepageCategorySection updates a section by ID.
func UpdateHomepageCategorySection(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	var sec models.HomepageCategorySection
	if err := db.Where("id = ?", id).First(&sec).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Section tidak ditemukan"})
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	delete(updates, "id")
	delete(updates, "created_at")
	updates["updated_at"] = time.Now()

	if err := db.Model(&sec).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui section", "details": err.Error()})
	}
	return c.JSON(sec)
}

// DeleteHomepageCategorySection deletes a section by ID.
func DeleteHomepageCategorySection(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	if err := db.Where("id = ?", id).Delete(&models.HomepageCategorySection{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus section"})
	}
	return c.JSON(fiber.Map{"message": "Section dihapus"})
}

// ReorderHomepageCategorySections bulk-updates sort_order.
// Body: [ { "id": "...", "sort_order": 1 }, ... ]
func ReorderHomepageCategorySections(c *fiber.Ctx) error {
	db := database.DB

	type Item struct {
		ID        string `json:"id"`
		SortOrder int    `json:"sort_order"`
	}
	var items []Item
	if err := c.BodyParser(&items); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	for _, item := range items {
		db.Model(&models.HomepageCategorySection{}).
			Where("id = ?", item.ID).
			Updates(map[string]interface{}{
				"sort_order": item.SortOrder,
				"updated_at": time.Now(),
			})
	}
	return c.JSON(fiber.Map{"message": "Urutan diperbarui"})
}
