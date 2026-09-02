package handlers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"fmt"
	"html"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// truncateRunes truncates a string to maxRunes Unicode code points, appending ellipsis if needed.
func truncateRunes(s string, maxRunes int) string {
	if utf8.RuneCountInString(s) <= maxRunes {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxRunes-3]) + "..."
}

// ServeDynamicSEO serves index.html with dynamically injected Open Graph SEO tags for articles, products, and categories
func ServeDynamicSEO(c *fiber.Ctx) error {
	slug := c.Params("slug")
	// ogType holds the valid OG type value (article / product / website)
	ogType := "article"
	// contentKind holds internal routing kind (artikel / produk / kategori / page / article)
	contentKind := "article"

	parts := strings.Split(c.Path(), "/")
	if len(parts) > 2 {
		switch parts[1] {
		case "artikel":
			contentKind = "article"
			ogType = "article"
			slug = parts[2]
		case "produk":
			contentKind = "produk"
			ogType = "product"
			slug = parts[2]
		case "kategori":
			contentKind = "kategori"
			ogType = "website"
			slug = parts[2]
		case "p":
			contentKind = "page"
			ogType = "article"
			slug = parts[2]
		}
	} else if len(parts) > 1 && slug == "" {
		slug = parts[1]
	}

	// Try reading index.html from dist folder
	indexPath := "../dist/index.html"
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		indexPath = "dist/index.html"
	}

	data, err := ioutil.ReadFile(indexPath)
	if err != nil {
		return c.Status(fiber.StatusNotFound).SendString("Frontend build (dist/index.html) not found. Please build frontend first.")
	}

	htmlContent := string(data)

	// Fetch site settings from DB
	var settings models.SiteSettings
	database.DB.First(&settings)
	siteName := strings.TrimSpace(settings.SiteName)
	if siteName == "" {
		siteName = "E-Kajian"
	}
	siteTitle := strings.TrimSpace(settings.Tagline)
	if siteTitle == "" {
		siteTitle = siteName
	}
	siteDesc := strings.TrimSpace(settings.SiteDescription)
	if siteDesc == "" {
		siteDesc = "Portal Resmi Kajian Online"
	}
	// Twitter handle from site name (fallback — no dedicated field in SiteSettings yet)
	twitterHandle := "@" + strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(siteName, " ", ""), ".", ""))

	dynamicTitle := siteTitle
	dynamicDesc  := siteDesc
	articleFound := false
	var shareImage string

	// Extra article-specific metadata for rich OG tags
	var articlePublishedAt string
	var articleModifiedAt  string
	var articleAuthor      string
	var articleSection     string   // primary category
	var articleTags        []string // tags array
	var articleReadingMins int

	// Fetch data from database depending on contentKind
	if slug != "" {
		slug = strings.Split(slug, "?")[0]

		if contentKind == "produk" {
			var product models.Product
			if err := database.DB.Where("slug = ? AND is_active = ?", slug, true).First(&product).Error; err == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("%s | %s", product.Title, siteName)
				dynamicDesc = truncateRunes(product.Description, 160)
				shareImage = product.ImageURL
			}
		} else if contentKind == "kategori" {
			var category models.Category
			if err := database.DB.Where("slug = ? AND is_active = ?", slug, true).First(&category).Error; err == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("Kategori %s | %s", category.Name, siteName)
				dynamicDesc = fmt.Sprintf("Daftar artikel kajian terbaik dalam kategori %s.", category.Name)
				shareImage = settings.LogoURL
			}
		} else if contentKind == "page" {
			var page models.Page
			if err := database.DB.Where("slug = ? AND status = ?", slug, "published").First(&page).Error; err == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("%s | %s", page.Title, siteName)
				excerpt := stripHTML(page.Content)
				dynamicDesc = truncateRunes(excerpt, 160)
				shareImage = page.HeroImage
				articlePublishedAt = page.CreatedAt.UTC().Format(time.RFC3339)
				articleModifiedAt  = page.UpdatedAt.UTC().Format(time.RFC3339)
			}
		} else { // default to article
			var article models.Article
			var dbErr error
			if _, uuidErr := uuid.Parse(slug); uuidErr == nil {
				dbErr = database.DB.Where("(slug = ? OR id = ?) AND status = ?", slug, slug, "published").First(&article).Error
			} else {
				dbErr = database.DB.Where("slug = ? AND status = ?", slug, "published").First(&article).Error
			}

			if dbErr == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("%s | %s", article.Title, siteName)

				excerpt := article.Excerpt
				if excerpt == "" {
					excerpt = stripHTML(article.Content)
				}
				dynamicDesc = truncateRunes(excerpt, 160)
				shareImage = article.CoverImage

				// Rich article metadata
				if article.PublishedAt != nil {
					articlePublishedAt = article.PublishedAt.UTC().Format(time.RFC3339)
				} else {
					articlePublishedAt = article.CreatedAt.UTC().Format(time.RFC3339)
				}
				articleModifiedAt = article.UpdatedAt.UTC().Format(time.RFC3339)
				articleAuthor = article.AuthorName
				if articleAuthor == "" {
					articleAuthor = siteName
				}
				// Primary category for article:section
				if article.Category != "" {
					articleSection = article.Category
				} else if len(article.Categories) > 0 {
					articleSection = article.Categories[0]
				}
				// Tags for article:tag
				articleTags = []string(article.Tags)
				// Estimate reading time
				wordCount := len(strings.Fields(stripHTML(article.Content)))
				if wordCount > 0 {
					articleReadingMins = wordCount / 200
					if articleReadingMins < 1 {
						articleReadingMins = 1
					}
				} else {
					articleReadingMins = 1
				}
			}
		}
	}

	// Replace the hardcoded placeholders in index.html shell
	htmlContent = strings.ReplaceAll(htmlContent, "<title>Buya Muhammad Elvisyam</title>", fmt.Sprintf("<title>%s</title>", dynamicTitle))
	htmlContent = strings.ReplaceAll(htmlContent, "<meta name=\"description\" content=\"Akhimedia Generated Project\">", fmt.Sprintf("<meta name=\"description\" content=\"%s\">", dynamicDesc))
	htmlContent = strings.ReplaceAll(htmlContent, "<meta name=\"description\" content=\"Portal Resmi Kajian Islam & Artikel Pilihan\">", fmt.Sprintf("<meta name=\"description\" content=\"%s\">", dynamicDesc))
	htmlContent = strings.ReplaceAll(htmlContent, "<meta name=\"author\" content=\"Buya Muhammad Elvisyam\" />", fmt.Sprintf("<meta name=\"author\" content=\"%s\" />", siteName))
	htmlContent = strings.ReplaceAll(htmlContent, "<meta name=\"author\" content=\"Akhimedia\" />", fmt.Sprintf("<meta name=\"author\" content=\"%s\" />", siteName))

	// Dynamically replace Google Analytics ID
	if settings.GoogleAnalyticsID != "" {
		htmlContent = strings.ReplaceAll(htmlContent, "G-5DQ01JS2EP", settings.GoogleAnalyticsID)
	}

	// ── Open Graph injection ──────────────────────────────────────────────────
	baseURL := c.Protocol() + "://" + c.Hostname()
	fullURL  := baseURL + c.Path()
	var ogInjection strings.Builder

	// Escape values for safe HTML attribute embedding
	safeTitle     := html.EscapeString(dynamicTitle)
	safeDesc      := html.EscapeString(dynamicDesc)
	safeSiteTitle := html.EscapeString(siteTitle)
	safeSiteDesc  := html.EscapeString(siteDesc)
	safeSiteName  := html.EscapeString(siteName)
	safeAuthor    := html.EscapeString(articleAuthor)
	safeSection   := html.EscapeString(articleSection)

	if articleFound {
		coverImage := shareImage
		if coverImage == "" {
			coverImage = "/og-image.jpg"
		}
		if !strings.HasPrefix(coverImage, "http") {
			if strings.HasPrefix(coverImage, "/") {
				coverImage = baseURL + coverImage
			} else {
				coverImage = baseURL + "/" + coverImage
			}
		}

		// ── Core OG ──
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:type\" content=\"%s\" />", ogType))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:title\" content=\"%s\" />", safeTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:description\" content=\"%s\" />", safeDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:url\" content=\"%s\" />", fullURL))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:site_name\" content=\"%s\" />", safeSiteName))
		ogInjection.WriteString("\n  <meta property=\"og:locale\" content=\"id_ID\" />")

		// ── OG Image with dimensions (1200×630 is the Facebook/WhatsApp optimal size) ──
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image\" content=\"%s\" />", coverImage))
		ogInjection.WriteString("\n  <meta property=\"og:image:width\" content=\"1200\" />")
		ogInjection.WriteString("\n  <meta property=\"og:image:height\" content=\"630\" />")
		ogInjection.WriteString("\n  <meta property=\"og:image:type\" content=\"image/jpeg\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image:alt\" content=\"%s\" />", safeTitle))

		// ── Article-specific OG (only for article type) ──
		if ogType == "article" {
			if articlePublishedAt != "" {
				ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"article:published_time\" content=\"%s\" />", articlePublishedAt))
			}
			if articleModifiedAt != "" {
				ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"article:modified_time\" content=\"%s\" />", articleModifiedAt))
			}
			if safeAuthor != "" {
				ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"article:author\" content=\"%s\" />", safeAuthor))
			}
			if safeSection != "" {
				ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"article:section\" content=\"%s\" />", safeSection))
			}
			for _, tag := range articleTags {
				if tag != "" {
					ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"article:tag\" content=\"%s\" />", html.EscapeString(tag)))
				}
			}
		}

		// ── Twitter Card ──
		ogInjection.WriteString("\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:site\" content=\"%s\" />", twitterHandle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:creator\" content=\"%s\" />", twitterHandle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:title\" content=\"%s\" />", safeTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:description\" content=\"%s\" />", safeDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image\" content=\"%s\" />", coverImage))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image:alt\" content=\"%s\" />", safeTitle))
		// Twitter App Card labels (shown in tweet cards on Twitter/X)
		if articleReadingMins > 0 {
			ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:label1\" content=\"Estimasi Baca\" />"))
			ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:data1\" content=\"%d menit\" />", articleReadingMins))
		}
		if safeSection != "" {
			ogInjection.WriteString("\n  <meta name=\"twitter:label2\" content=\"Kategori\" />")
			ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:data2\" content=\"%s\" />", safeSection))
		}
		ogInjection.WriteString("\n")

	} else {
		// ── Fallback: homepage / not-found ──
		logoImage := settings.LogoURL
		if logoImage == "" {
			logoImage = "/og-image.jpg"
		}
		if !strings.HasPrefix(logoImage, "http") {
			if strings.HasPrefix(logoImage, "/") {
				logoImage = baseURL + logoImage
			} else {
				logoImage = baseURL + "/" + logoImage
			}
		}

		ogInjection.WriteString("\n  <meta property=\"og:type\" content=\"website\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:title\" content=\"%s\" />", safeSiteTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:description\" content=\"%s\" />", safeSiteDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:url\" content=\"%s\" />", fullURL))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:site_name\" content=\"%s\" />", safeSiteName))
		ogInjection.WriteString("\n  <meta property=\"og:locale\" content=\"id_ID\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image\" content=\"%s\" />", logoImage))
		ogInjection.WriteString("\n  <meta property=\"og:image:width\" content=\"1200\" />")
		ogInjection.WriteString("\n  <meta property=\"og:image:height\" content=\"630\" />")
		ogInjection.WriteString("\n  <meta property=\"og:image:type\" content=\"image/jpeg\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image:alt\" content=\"%s\" />", safeSiteName))
		ogInjection.WriteString("\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:site\" content=\"%s\" />", twitterHandle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:title\" content=\"%s\" />", safeSiteTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:description\" content=\"%s\" />", safeSiteDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image\" content=\"%s\" />", logoImage))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image:alt\" content=\"%s\" />", safeSiteName))
		ogInjection.WriteString("\n")
	}

	htmlContent = strings.Replace(htmlContent, "</head>", ogInjection.String()+"</head>", 1)

	// ── Server-side JSON-LD injection (BlogPosting schema for articles) ──────
	// This ensures crawlers that don't run JavaScript still get structured data.
	if articleFound && ogType == "article" && articlePublishedAt != "" {
		tagsInterface := make([]interface{}, len(articleTags))
		for i, t := range articleTags {
			tagsInterface[i] = t
		}

		jsonLd := map[string]interface{}{
			"@context": "https://schema.org",
			"@type":    "BlogPosting",
			"mainEntityOfPage": map[string]interface{}{
				"@type": "WebPage",
				"@id":   fullURL,
			},
			"headline":      dynamicTitle,
			"description":   dynamicDesc,
			"datePublished": articlePublishedAt,
			"dateModified":  articleModifiedAt,
			"author": map[string]interface{}{
				"@type": "Person",
				"name":  articleAuthor,
			},
			"publisher": map[string]interface{}{
				"@type": "Organization",
				"name":  siteName,
				"logo": map[string]interface{}{
					"@type": "ImageObject",
					"url":   baseURL + "/og-image.jpg",
				},
			},
		}

		// Add image if available
		if shareImage != "" {
			coverAbs := shareImage
			if !strings.HasPrefix(coverAbs, "http") {
				if strings.HasPrefix(coverAbs, "/") {
					coverAbs = baseURL + coverAbs
				} else {
					coverAbs = baseURL + "/" + coverAbs
				}
			}
			jsonLd["image"] = []string{coverAbs}
		}

		// Add keywords if tags present
		if len(articleTags) > 0 {
			jsonLd["keywords"] = strings.Join(articleTags, ", ")
		}

		// Add articleSection if present
		if articleSection != "" {
			jsonLd["articleSection"] = articleSection
		}

		// Add reading time
		if articleReadingMins > 0 {
			jsonLd["timeRequired"] = fmt.Sprintf("PT%dM", articleReadingMins)
		}

		if jsonBytes, err := json.Marshal(jsonLd); err == nil {
			jsonLdScript := fmt.Sprintf("\n  <script type=\"application/ld+json\">\n  %s\n  </script>\n", string(jsonBytes))
			htmlContent = strings.Replace(htmlContent, "</head>", jsonLdScript+"</head>", 1)
		}
	}

	c.Set("Content-Type", "text/html")
	return c.SendString(htmlContent)
}

// Simple helper to strip HTML tags for clean meta descriptions
func stripHTML(html string) string {
	var plainText strings.Builder
	inTag := false
	for _, char := range html {
		if char == '<' {
			inTag = true
		} else if char == '>' {
			inTag = false
		} else if !inTag {
			plainText.WriteRune(char)
		}
	}
	return strings.TrimSpace(plainText.String())
}

func GenerateSitemapFile() {
	db := database.DB
	if db == nil {
		log.Println("[Sitemap Warning] Database not connected, skipping sitemap file generation.")
		return
	}

	var articles []models.Article
	var pages []models.Page
	var categories []models.Category
	var courses []models.Course
	var lessons []models.Lesson

	db.Where("status = ?", "published").Find(&articles)
	db.Where("status = ?", "published").Find(&pages)
	db.Find(&categories)
	db.Where("is_published = ?", true).Find(&courses)
	db.Where("is_free = ?", true).Find(&lessons)

	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL")), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("SITE_URL")), "/")
	}
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("VITE_SITE_URL")), "/")
	}
	if baseURL == "" {
		baseURL = "https://e-kajian.web.id"
	}

	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	b.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)

	// Homepage
	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/</loc>
    <lastmod>%s</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`, baseURL, time.Now().Format("2006-01-02")))

	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/donasi</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL))

	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL))

	// Articles
	for _, a := range articles {
		slug := a.Slug
		if slug == "" {
			slug = a.ID.String()
		}
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/artikel/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`, baseURL, slug, a.UpdatedAt.Format("2006-01-02")))
	}

	// Categories
	for _, cat := range categories {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/kategori/%s</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL, cat.Slug))
	}

	// Dynamic Pages
	for _, p := range pages {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/p/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`, baseURL, p.Slug, p.UpdatedAt.Format("2006-01-02")))
	}

	for _, cse := range courses {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms/course/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL, cse.Slug, cse.UpdatedAt.Format("2006-01-02")))
	}

	for _, l := range lessons {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms/lesson/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`, baseURL, l.Slug, l.CreatedAt.Format("2006-01-02")))
	}

	b.WriteString("\n</urlset>")

	xmlContent := b.String()

	// Direct paths to write sitemap
	paths := []string{
		"../dist/sitemap.xml",
		"dist/sitemap.xml",
		"../public/sitemap.xml",
		"public/sitemap.xml",
	}

	for _, path := range paths {
		dir := path
		if idx := strings.LastIndex(path, "/"); idx != -1 {
			dir = path[:idx]
		}
		if _, err := os.Stat(dir); err == nil {
			err = ioutil.WriteFile(path, []byte(xmlContent), 0644)
			if err == nil {
				log.Printf("[Sitemap] Successfully wrote static sitemap.xml to %s", path)
			}
		}
	}
}

func GetSitemap(c *fiber.Ctx) error {
	// Dynamically generate first
	GenerateSitemapFile()

	db := database.DB
	var articles []models.Article
	var pages []models.Page
	var categories []models.Category
	var courses []models.Course
	var lessons []models.Lesson

	db.Where("status = ?", "published").Find(&articles)
	db.Where("status = ?", "published").Find(&pages)
	db.Find(&categories)
	db.Where("is_published = ?", true).Find(&courses)
	db.Where("is_free = ?", true).Find(&lessons)

	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL")), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("SITE_URL")), "/")
	}
	if baseURL == "" {
		baseURL = strings.TrimRight(c.Protocol()+"://"+c.Hostname(), "/")
	}

	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	b.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)

	// Homepage
	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/</loc>
    <lastmod>%s</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`, baseURL, time.Now().Format("2006-01-02")))

	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/donasi</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL))

	b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL))

	// Articles
	for _, a := range articles {
		slug := a.Slug
		if slug == "" {
			slug = a.ID.String()
		}
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/artikel/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`, baseURL, slug, a.UpdatedAt.Format("2006-01-02")))
	}

	// Categories
	for _, cat := range categories {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/kategori/%s</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL, cat.Slug))
	}

	// Dynamic Pages
	for _, p := range pages {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/p/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`, baseURL, p.Slug, p.UpdatedAt.Format("2006-01-02")))
	}

	for _, cse := range courses {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms/course/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL, cse.Slug, cse.UpdatedAt.Format("2006-01-02")))
	}

	for _, l := range lessons {
		b.WriteString(fmt.Sprintf(`
  <url>
    <loc>%s/lms/lesson/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`, baseURL, l.Slug, l.CreatedAt.Format("2006-01-02")))
	}

	b.WriteString("\n</urlset>")

	c.Set("Content-Type", "application/xml")
	return c.SendString(b.String())
}

func Health(c *fiber.Ctx) error {
	sqlDB, err := database.DB.DB()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "db": "unavailable"})
	}
	if err := sqlDB.Ping(); err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "db": "down"})
	}
	return c.JSON(fiber.Map{"status": "ok"})
}
