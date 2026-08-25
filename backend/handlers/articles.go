package handlers

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

var nonSlugChars = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonSlugChars.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}

func ensureUniqueSlug(db *gorm.DB, base string) (string, error) {
	slug := base
	if slug == "" {
		slug = "artikel"
	}

	var count int64
	if err := db.Model(&models.Article{}).Where("slug = ?", slug).Count(&count).Error; err != nil {
		return "", err
	}
	if count == 0 {
		return slug, nil
	}

	for i := 2; i <= 200; i++ {
		trySlug := fmt.Sprintf("%s-%d", slug, i)
		if err := db.Model(&models.Article{}).Where("slug = ?", trySlug).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return trySlug, nil
		}
	}
	return "", fmt.Errorf("could not generate unique slug")
}

func GetArticles(c *fiber.Ctx) error {
	db := database.DB
	var articles []models.Article
	
	status := c.Query("status", "all")
	limit := c.QueryInt("limit", 100)

	query := db.Order("published_at desc").Limit(limit)
	if status != "all" {
		query = query.Where("status = ?", status)
	}

	if c.Query("featured") == "true" {
		query = query.Where("is_featured = ?", true)
	}
	
	if err := query.Find(&articles).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat artikel"})
	}

	authorIDSet := make(map[uuid.UUID]struct{})
	articleIDSet := make(map[uuid.UUID]struct{})
	for i := range articles {
		authorIDSet[articles[i].AuthorID] = struct{}{}
		articleIDSet[articles[i].ID] = struct{}{}
	}

	authorIDs := make([]uuid.UUID, 0, len(authorIDSet))
	for id := range authorIDSet {
		authorIDs = append(authorIDs, id)
	}

	type AuthorRow struct {
		UserID      uuid.UUID
		DisplayName string
	}
	authorNameByUserID := make(map[uuid.UUID]string, len(authorIDs))
	if len(authorIDs) > 0 {
		var rows []AuthorRow
		db.Model(&models.Profile{}).
			Select("user_id, display_name").
			Where("user_id IN ?", authorIDs).
			Find(&rows)
		for _, r := range rows {
			if r.DisplayName != "" {
				authorNameByUserID[r.UserID] = r.DisplayName
			}
		}
	}

	articleIDs := make([]uuid.UUID, 0, len(articleIDSet))
	for id := range articleIDSet {
		articleIDs = append(articleIDs, id)
	}

	type CommentCountRow struct {
		ArticleID uuid.UUID
		Count     int64
	}
	commentCountByArticleID := make(map[uuid.UUID]int64, len(articleIDs))
	if len(articleIDs) > 0 {
		var rows []CommentCountRow
		db.Model(&models.Comment{}).
			Select("article_id, count(*) as count").
			Where("article_id IN ?", articleIDs).
			Group("article_id").
			Scan(&rows)
		for _, r := range rows {
			commentCountByArticleID[r.ArticleID] = r.Count
		}
	}

	// Fetch author names and comment counts
	for i := range articles {
		if n, ok := authorNameByUserID[articles[i].AuthorID]; ok {
			articles[i].AuthorName = n
		} else {
			articles[i].AuthorName = "Ustadz"
		}
		if c, ok := commentCountByArticleID[articles[i].ID]; ok {
			articles[i].CommentCount = c
		} else {
			articles[i].CommentCount = 0
		}
	}

	return c.JSON(articles)
}

type ExportAuthor struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ExportArticleItem struct {
	ID            string         `json:"id"`
	Title         string         `json:"title"`
	Slug          string         `json:"slug"`
	Content       string         `json:"content"`
	Excerpt       string         `json:"excerpt"`
	CoverImage    string         `json:"cover_image"`
	Categories    pq.StringArray `json:"categories"`
	Tags          pq.StringArray `json:"tags"`
	IsFeatured    bool           `json:"is_featured"`
	Views         int            `json:"views"`
	LocationName  string         `json:"location_name"`
	Latitude      float64        `json:"latitude"`
	Longitude     float64        `json:"longitude"`
	YoutubeURL    string         `json:"youtube_url"`
	Author        ExportAuthor   `json:"author"`
	CanonicalPath string         `json:"canonical_path"`
	CreatedAt     string         `json:"created_at"`
	UpdatedAt     string         `json:"updated_at"`
}

func ExportArticles(c *fiber.Ctx) error {
	db := database.DB

	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}

	limit := c.QueryInt("limit", 20)
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	includeContent := c.Query("include_content") == "true"

	var sinceTime time.Time
	since := c.Query("since")
	if since != "" {
		t, err := time.Parse(time.RFC3339, since)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "since harus format RFC3339, contoh: 2026-06-01T00:00:00Z"})
		}
		sinceTime = t
	}

	q := db.Model(&models.Article{}).Where("status = ?", "published")
	if since != "" {
		q = q.Where("updated_at >= ?", sinceTime)
	}

	var total int64
	q.Count(&total)

	var articles []models.Article
	offset := (page - 1) * limit
	if err := q.Order("published_at desc").Offset(offset).Limit(limit).Find(&articles).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil artikel"})
	}

	items := make([]ExportArticleItem, 0, len(articles))
	for _, a := range articles {
		var p models.Profile
		db.Select("display_name").Where("user_id = ?", a.AuthorID).First(&p)

		cats := a.Categories
		if len(cats) == 0 && a.Category != "" {
			cats = []string{a.Category}
		}

		content := ""
		if includeContent {
			content = a.Content
		}

		items = append(items, ExportArticleItem{
			ID:         a.ID.String(),
			Title:      a.Title,
			Slug:       a.Slug,
			Content:    content,
			Excerpt:    a.Excerpt,
			CoverImage: a.CoverImage,
			Categories: cats,
			Tags:       a.Tags,
			IsFeatured: a.IsFeatured,
			Views:      a.Views,
			LocationName: a.LocationName,
			Latitude:     a.Latitude,
			Longitude:    a.Longitude,
			YoutubeURL:   a.YoutubeURL,
			Author: ExportAuthor{
				ID:   a.AuthorID.String(),
				Name: p.DisplayName,
			},
			CanonicalPath: "/artikel/" + a.Slug,
			CreatedAt:     a.CreatedAt.UTC().Format(time.RFC3339),
			UpdatedAt:     a.UpdatedAt.UTC().Format(time.RFC3339),
		})
	}

	nextPage := 0
	if int64(offset+len(articles)) < total {
		nextPage = page + 1
	}

	return c.JSON(fiber.Map{
		"version":      "v1",
		"generated_at": time.Now().UTC().Format(time.RFC3339),
		"filters": fiber.Map{
			"since":           since,
			"include_content": includeContent,
			"status":          "published",
		},
		"page":      page,
		"limit":     limit,
		"next_page": nextPage,
		"total":     total,
		"items":     items,
	})
}

func ExportArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	query := db.Where("status = ?", "published")
	if _, err := uuid.Parse(id); err == nil {
		query = query.Where("id = ?", id)
	} else {
		query = query.Where("slug = ?", id)
	}

	var a models.Article
	if err := query.First(&a).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}

	var p models.Profile
	db.Model(&models.Profile{}).Select("display_name").Where("user_id = ?", a.AuthorID).Limit(1).Find(&p)

	cats := a.Categories
	if len(cats) == 0 && a.Category != "" {
		cats = []string{a.Category}
	}

	item := ExportArticleItem{
		ID:         a.ID.String(),
		Title:      a.Title,
		Slug:       a.Slug,
		Content:    a.Content,
		Excerpt:    a.Excerpt,
		CoverImage: a.CoverImage,
		Categories: cats,
		Tags:       a.Tags,
		IsFeatured: a.IsFeatured,
		Views:      a.Views,
		LocationName: a.LocationName,
		Latitude:     a.Latitude,
		Longitude:    a.Longitude,
		YoutubeURL:   a.YoutubeURL,
		Author: ExportAuthor{
			ID:   a.AuthorID.String(),
			Name: func() string {
				if p.DisplayName != "" {
					return p.DisplayName
				}
				return "Ustadz"
			}(),
		},
		CanonicalPath: "/artikel/" + a.Slug,
		CreatedAt:     a.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     a.UpdatedAt.UTC().Format(time.RFC3339),
	}

	return c.JSON(fiber.Map{
		"version":      "v1",
		"generated_at": time.Now().UTC().Format(time.RFC3339),
		"item":         item,
	})
}

func GetArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	if _, err := uuid.Parse(id); err == nil {
		if err := db.Where("id = ?", id).First(&article).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
		}
	} else {
		if err := db.Where("slug = ?", id).First(&article).Error; err != nil {
			var matches []models.Article
			if err := db.Where("slug LIKE ?", id+"-%").Limit(2).Find(&matches).Error; err != nil || len(matches) != 1 {
				return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
			}
			article = matches[0]
		}
	}
	
	var p models.Profile
	db.Model(&models.Profile{}).Select("display_name").Where("user_id = ?", article.AuthorID).Limit(1).Find(&p)
	if p.DisplayName != "" {
		article.AuthorName = p.DisplayName
	} else {
		article.AuthorName = "Ustadz"
	}

	var count int64
	db.Model(&models.Comment{}).Where("article_id = ?", article.ID).Count(&count)
	article.CommentCount = count

	return c.JSON(article)
}

func GetRelatedArticles(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	limit := c.QueryInt("limit", 6)
	if limit <= 0 {
		limit = 6
	}
	if limit > 12 {
		limit = 12
	}

	db := database.DB

	var current models.Article
	if _, err := uuid.Parse(id); err == nil {
		if err := db.Where("id = ?", id).First(&current).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
		}
	} else {
		if err := db.Where("slug = ?", id).First(&current).Error; err != nil {
			var matches []models.Article
			if err := db.Where("slug LIKE ?", id+"-%").Limit(2).Find(&matches).Error; err != nil || len(matches) != 1 {
				return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
			}
			current = matches[0]
		}
	}

	category := strings.TrimSpace(current.Category)
	tags := []string(current.Tags)

	var articles []models.Article
	query := db.Model(&models.Article{}).
		Where("status = ? AND id <> ?", "published", current.ID)

	switch {
	case category != "" && len(tags) > 0:
		query = query.Where("(category = ? OR tags && ?)", category, pq.Array(tags))
	case category != "":
		query = query.Where("category = ?", category)
	case len(tags) > 0:
		query = query.Where("tags && ?", pq.Array(tags))
	default:
		query = query.Where("category <> ''")
	}

	if err := query.Order("published_at desc").Limit(limit).Find(&articles).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat artikel terkait"})
	}

	authorIDSet := make(map[uuid.UUID]struct{})
	articleIDSet := make(map[uuid.UUID]struct{})
	for i := range articles {
		authorIDSet[articles[i].AuthorID] = struct{}{}
		articleIDSet[articles[i].ID] = struct{}{}
	}

	authorIDs := make([]uuid.UUID, 0, len(authorIDSet))
	for aid := range authorIDSet {
		authorIDs = append(authorIDs, aid)
	}

	type AuthorRow struct {
		UserID      uuid.UUID
		DisplayName string
	}
	authorNameByUserID := make(map[uuid.UUID]string, len(authorIDs))
	if len(authorIDs) > 0 {
		var rows []AuthorRow
		db.Model(&models.Profile{}).
			Select("user_id, display_name").
			Where("user_id IN ?", authorIDs).
			Find(&rows)
		for _, r := range rows {
			if r.DisplayName != "" {
				authorNameByUserID[r.UserID] = r.DisplayName
			}
		}
	}

	articleIDs := make([]uuid.UUID, 0, len(articleIDSet))
	for aID := range articleIDSet {
		articleIDs = append(articleIDs, aID)
	}

	type CommentCountRow struct {
		ArticleID uuid.UUID
		Count     int64
	}
	commentCountByArticleID := make(map[uuid.UUID]int64, len(articleIDs))
	if len(articleIDs) > 0 {
		var rows []CommentCountRow
		db.Model(&models.Comment{}).
			Select("article_id, count(*) as count").
			Where("article_id IN ?", articleIDs).
			Group("article_id").
			Scan(&rows)
		for _, r := range rows {
			commentCountByArticleID[r.ArticleID] = r.Count
		}
	}

	for i := range articles {
		if n, ok := authorNameByUserID[articles[i].AuthorID]; ok {
			articles[i].AuthorName = n
		} else {
			articles[i].AuthorName = "Ustadz"
		}
		if cc, ok := commentCountByArticleID[articles[i].ID]; ok {
			articles[i].CommentCount = cc
		} else {
			articles[i].CommentCount = 0
		}
	}

	return c.JSON(articles)
}

func CreateArticle(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	authorIDStr := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)

	// Use intermediate struct so date strings don't break BodyParser
	var input struct {
		Title              *string         `json:"title"`
		Slug               *string         `json:"slug"`
		Content            *string         `json:"content"`
		Excerpt            *string         `json:"excerpt"`
		CoverImage         *string         `json:"cover_image"`
		Category           *string         `json:"category"`
		Categories         *pq.StringArray `json:"categories"`
		Tags               *pq.StringArray `json:"tags"`
		Status             *string         `json:"status"`
		TemplateType       *string         `json:"template_type"`
		IsFeatured         *bool           `json:"is_featured"`
		YoutubeURL         *string         `json:"youtube_url"`
		ScheduledPublishAt *string         `json:"scheduled_publish_at"`
		PublishedAtDate    *string         `json:"published_at"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	authorID, err := uuid.Parse(authorIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid author ID"})
	}

	article := models.Article{AuthorID: authorID}
	if input.Title != nil {
		article.Title = strings.TrimSpace(*input.Title)
	}
	if input.Slug != nil {
		article.Slug = slugify(strings.TrimSpace(*input.Slug))
	}
	if input.Content != nil {
		article.Content = *input.Content
	}
	if input.Excerpt != nil {
		article.Excerpt = *input.Excerpt
	}
	if input.CoverImage != nil {
		article.CoverImage = *input.CoverImage
	}
	if input.Categories != nil {
		article.Categories = *input.Categories
	}
	if input.Tags != nil {
		article.Tags = *input.Tags
	}
	if input.Status != nil {
		article.Status = strings.TrimSpace(*input.Status)
	}
	if input.TemplateType != nil {
		article.TemplateType = normalizeTemplateType(*input.TemplateType)
	}
	if input.IsFeatured != nil {
		article.IsFeatured = *input.IsFeatured
	}
	if input.YoutubeURL != nil {
		article.YoutubeURL = *input.YoutubeURL
	}

	// Parse scheduled_publish_at
	if input.ScheduledPublishAt != nil && strings.TrimSpace(*input.ScheduledPublishAt) != "" {
		raw := strings.TrimSpace(*input.ScheduledPublishAt)
		if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			article.ScheduledPublishAt = &parsed
		}
	}

	// Parse published_at
	if input.PublishedAtDate != nil && strings.TrimSpace(*input.PublishedAtDate) != "" {
		raw := strings.TrimSpace(*input.PublishedAtDate)
		if parsed, err := time.Parse("2006-01-02", raw); err == nil {
			article.PublishedAt = &parsed
		} else if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			article.PublishedAt = &parsed
		}
	}

	// Default published_at to now if not set
	if article.PublishedAt == nil || article.PublishedAt.IsZero() {
		now := time.Now()
		article.PublishedAt = &now
	}

	article.Title = strings.TrimSpace(article.Title)
	article.TemplateType = normalizeTemplateType(article.TemplateType)
	article.Status = strings.TrimSpace(article.Status)

	if article.Slug == "" {
		article.Slug = slugify(article.Title)
	}

	// Handle multi-category compatibility
	if len(article.Categories) > 0 {
		article.Category = article.Categories[0]
	} else if article.Category != "" {
		article.Categories = []string{article.Category}
	} else {
		article.Category = "Umum"
		article.Categories = []string{"Umum"}
	}

	if role != "admin" {
		article.Status = "draft"
		article.ScheduledPublishAt = nil
	} else {
		if article.Status == "" {
			article.Status = "draft"
		}
	}

	db := database.DB
	uniqueSlug, err := ensureUniqueSlug(db, article.Slug)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not generate unique slug"})
	}
	article.Slug = uniqueSlug

	if err := db.Create(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create article"})
	}

	return c.JSON(article)
}

func UpdateArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}

	prevStatus := strings.TrimSpace(article.Status)

	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)
	userID, _ := uuid.Parse(strings.TrimSpace(userIDStr))

	var input struct {
		Title        *string         `json:"title"`
		Slug         *string         `json:"slug"`
		Content      *string         `json:"content"`
		Excerpt      *string         `json:"excerpt"`
		Category     *string         `json:"category"`
		Categories   *pq.StringArray `json:"categories"`
		CoverImage   *string         `json:"cover_image"`
		Status       *string         `json:"status"`
		TemplateType *string         `json:"template_type"`
		IsFeatured   *bool           `json:"is_featured"`
		LocationName *string         `json:"location_name"`
		Latitude     *float64        `json:"latitude"`
		Longitude    *float64        `json:"longitude"`
		YoutubeURL   *string         `json:"youtube_url"`
		ScheduledPublishAt *string   `json:"scheduled_publish_at"`
		PublishedAtDate     *string   `json:"published_at"` // actual publication date for display
		Tags         *pq.StringArray `json:"tags"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	desiredStatus := strings.TrimSpace(article.Status)
	if input.Status != nil {
		desiredStatus = strings.TrimSpace(*input.Status)
	}
	if desiredStatus == "" {
		desiredStatus = "draft"
	}

	if role != "admin" && desiredStatus == "published" {
		return c.Status(403).JSON(fiber.Map{"error": "Hanya admin yang boleh mempublikasikan artikel"})
	}

	var nextScheduledAt *time.Time
	scheduledRaw := ""
	if input.ScheduledPublishAt != nil {
		scheduledRaw = strings.TrimSpace(*input.ScheduledPublishAt)
	}
	if scheduledRaw != "" {
		parsed, err := time.Parse(time.RFC3339, scheduledRaw)
		if err != nil {
			parsed, err = time.ParseInLocation("2006-01-02T15:04", scheduledRaw, time.Local)
		}
		if err == nil {
			nextScheduledAt = &parsed
		}
	}

	if role != "admin" {
		nextScheduledAt = nil
	}

	if role == "admin" && desiredStatus == "published" && nextScheduledAt != nil && nextScheduledAt.After(time.Now().Add(10*time.Second)) {
		desiredStatus = "review"
	}

	if role != "admin" && article.AuthorID != userID {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}

	if err := saveArticleRevision(db, article, userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan revisi"})
	}

	if input.Title != nil { article.Title = *input.Title }
	if input.Slug != nil { article.Slug = *input.Slug }
	if input.Content != nil { article.Content = *input.Content }
	if input.Excerpt != nil { article.Excerpt = *input.Excerpt }
	if input.CoverImage != nil { article.CoverImage = *input.CoverImage }
	article.Status = desiredStatus
	if input.TemplateType != nil { article.TemplateType = normalizeTemplateType(*input.TemplateType) }
	if input.IsFeatured != nil { article.IsFeatured = *input.IsFeatured }
	if input.LocationName != nil { article.LocationName = *input.LocationName }
	if input.Latitude != nil { article.Latitude = *input.Latitude }
	if input.Longitude != nil { article.Longitude = *input.Longitude }
	if input.YoutubeURL != nil { article.YoutubeURL = *input.YoutubeURL }
	if input.Tags != nil { article.Tags = *input.Tags }
	article.ScheduledPublishAt = nextScheduledAt

	// Handle published_at date override
	if input.PublishedAtDate != nil {
		raw := strings.TrimSpace(*input.PublishedAtDate)
		if parsed, err := time.Parse("2006-01-02", raw); err == nil {
			// Keep existing time, just change the date
			y, m, d := parsed.Date()
			existing := time.Now()
			if article.PublishedAt != nil && !article.PublishedAt.IsZero() {
				existing = *article.PublishedAt
			}
			newPub := time.Date(y, m, d, existing.Hour(), existing.Minute(), existing.Second(), 0, existing.Location())
			article.PublishedAt = &newPub
		} else if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
			article.PublishedAt = &parsed
		}
	}

	// Handle multi-category synchronization
	if input.Categories != nil {
		article.Categories = *input.Categories
		if len(article.Categories) > 0 {
			article.Category = article.Categories[0]
		}
	} else if input.Category != nil {
		article.Category = *input.Category
		article.Categories = []string{*input.Category}
	}

	if err := db.Save(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update article"})
	}

	if prevStatus != "published" && article.Status == "published" {
		go func(a models.Article) {
			defer func() { recover() }()
			NotifyWhatsAppNewArticle(a)
		}(article)
	}

	return c.JSON(article)
}

func GetArticleRevisions(c *fiber.Ctx) error {
	articleIDStr := strings.TrimSpace(c.Params("id"))
	aid, err := uuid.Parse(articleIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid article ID"})
	}

	limit := c.QueryInt("limit", 30)
	if limit <= 0 {
		limit = 30
	}
	if limit > 200 {
		limit = 200
	}

	var revs []models.ArticleRevision
	if err := database.DB.Where("article_id = ?", aid).Order("created_at desc").Limit(limit).Find(&revs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat revisi"})
	}
	return c.JSON(revs)
}

func RestoreArticleRevision(c *fiber.Ctx) error {
	articleIDStr := strings.TrimSpace(c.Params("id"))
	revIDStr := strings.TrimSpace(c.Params("revId"))
	aid, err := uuid.Parse(articleIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid article ID"})
	}
	rid, err := uuid.Parse(revIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid revision ID"})
	}

	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)
	userID, _ := uuid.Parse(strings.TrimSpace(userIDStr))

	db := database.DB

	var article models.Article
	if err := db.Where("id = ?", aid).First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}
	if role != "admin" && article.AuthorID != userID {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}

	var rev models.ArticleRevision
	if err := db.Where("id = ? AND article_id = ?", rid, aid).First(&rev).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Revision not found"})
	}

	if err := saveArticleRevision(db, article, userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan revisi"})
	}

	article.Title = rev.Title
	article.Content = rev.Content
	article.Excerpt = rev.Excerpt
	article.CoverImage = rev.CoverImage
	article.Category = rev.Category
	article.Categories = rev.Categories
	article.Tags = rev.Tags
	article.Status = rev.Status
	article.TemplateType = normalizeTemplateType(rev.TemplateType)
	article.ScheduledPublishAt = rev.ScheduledPublishAt
	article.PublishedAt = rev.PublishedAt

	if err := db.Save(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal merestore revisi"})
	}
	return c.JSON(article)
}

func saveArticleRevision(db *gorm.DB, a models.Article, savedBy uuid.UUID) error {
	rev := models.ArticleRevision{
		ID:                uuid.New(),
		ArticleID:          a.ID,
		Title:              a.Title,
		Content:            a.Content,
		Excerpt:            a.Excerpt,
		CoverImage:         a.CoverImage,
		Category:           a.Category,
		Categories:         a.Categories,
		Tags:               a.Tags,
		Status:             a.Status,
		TemplateType:       a.TemplateType,
		ScheduledPublishAt: a.ScheduledPublishAt,
		PublishedAt:        a.PublishedAt,
		SavedBy:            savedBy,
		CreatedAt:          time.Now(),
	}
	return db.Create(&rev).Error
}

func normalizeTemplateType(v string) string {
	s := strings.TrimSpace(strings.ToLower(v))
	switch s {
	case "kajian", "berita", "quote", "tanya_jawab":
		return s
	default:
		return "kajian"
	}
}

func DeleteArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}

	if err := db.Delete(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete article"})
	}

	return c.JSON(fiber.Map{"message": "Article deleted successfully"})
}

func BulkDeleteArticles(c *fiber.Ctx) error {
	db := database.DB
	
	category := c.Query("category")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	query := db.Model(&models.Article{})

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	if err := query.Delete(&models.Article{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not bulk delete articles"})
	}

	return c.JSON(fiber.Map{"message": "Articles deleted successfully"})
}

// BulkUpdateArticleImage updates cover_image for all articles in a given category
func BulkUpdateArticleImage(c *fiber.Ctx) error {
	db := database.DB

	var body struct {
		Category   string `json:"category"`
		CoverImage string `json:"cover_image"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if body.CoverImage == "" {
		return c.Status(400).JSON(fiber.Map{"error": "cover_image is required"})
	}

	query := db.Model(&models.Article{})
	if body.Category != "" && body.Category != "all" {
		query = query.Where("category = ?", body.Category)
	}

	result := query.Update("cover_image", body.CoverImage)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update images"})
	}

	return c.JSON(fiber.Map{
		"message":        "Berhasil mengupdate gambar artikel",
		"affected_count": result.RowsAffected,
		"category":       body.Category,
	})
}
