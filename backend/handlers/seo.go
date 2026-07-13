package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ServeDynamicSEO serves index.html with dynamically injected Open Graph SEO tags for articles, products, and categories
func ServeDynamicSEO(c *fiber.Ctx) error {
	slug := c.Params("slug")
	contentType := "article"
	
	parts := strings.Split(c.Path(), "/")
	if len(parts) > 2 {
		if parts[1] == "artikel" || parts[1] == "produk" || parts[1] == "kategori" {
			contentType = parts[1]
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

	dynamicTitle := siteTitle
	dynamicDesc := siteDesc
	articleFound := false
	var shareImage string

	// Fetch data from database depending on contentType
	if slug != "" {
		slug = strings.Split(slug, "?")[0]
		
		if contentType == "produk" {
			var product models.Product
			if err := database.DB.Where("slug = ? AND is_active = ?", slug, true).First(&product).Error; err == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("%s | %s", product.Title, siteName)
				dynamicDesc = product.Description
				if len(dynamicDesc) > 160 {
					dynamicDesc = dynamicDesc[:157] + "..."
				}
				shareImage = product.ImageURL
			}
		} else if contentType == "kategori" {
			var category models.Category
			if err := database.DB.Where("slug = ? AND is_active = ?", slug, true).First(&category).Error; err == nil {
				articleFound = true
				dynamicTitle = fmt.Sprintf("Kategori %s | %s", category.Name, siteName)
				dynamicDesc = fmt.Sprintf("Daftar artikel kajian terbaik dalam kategori %s.", category.Name)
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
					if len(excerpt) > 160 {
						excerpt = excerpt[:157] + "..."
					}
				}
				dynamicDesc = excerpt
				shareImage = article.CoverImage
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

	// Inject Open Graph tags
	baseURL := c.Protocol() + "://" + c.Hostname()
	fullURL := baseURL + c.Path()
	var ogInjection strings.Builder

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

		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:type\" content=\"%s\" />", contentType))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:title\" content=\"%s\" />", dynamicTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:description\" content=\"%s\" />", dynamicDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image\" content=\"%s\" />", coverImage))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:url\" content=\"%s\" />", fullURL))
		ogInjection.WriteString("\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />")
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:title\" content=\"%s\" />", dynamicTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:description\" content=\"%s\" />", dynamicDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image\" content=\"%s\" />", coverImage))
		ogInjection.WriteString("\n")
	} else {
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
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:title\" content=\"%s\" />", siteTitle))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:description\" content=\"%s\" />", siteDesc))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image\" content=\"%s\" />", logoImage))
		ogInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:url\" content=\"%s\" />", fullURL))
		ogInjection.WriteString("\n")
	}

	htmlContent = strings.Replace(htmlContent, "</head>", ogInjection.String()+"</head>", 1)

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
