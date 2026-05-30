package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// ServeDynamicSEO serves index.html with dynamically injected Open Graph SEO tags for articles
func ServeDynamicSEO(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		// Fallback slug from other routes or query
		parts := strings.Split(c.Path(), "/")
		if len(parts) > 2 && parts[1] == "artikel" {
			slug = parts[2]
		} else if len(parts) > 1 {
			slug = parts[1]
		}
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

	// Fetch article from database if slug exists
	var article models.Article
	if slug != "" {
		slug = strings.Split(slug, "?")[0]
		if err := database.DB.Where("slug = ? AND status = ?", slug, "published").First(&article).Error; err == nil {
			// Found article! Dynamically construct SEO tags
			baseURL := c.Protocol() + "://" + c.Hostname()
			fullURL := baseURL + c.Path()

			// Prepare Cover Image URL
			coverImage := article.CoverImage
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

			// Prepare Description Excerpt
			excerpt := article.Excerpt
			if excerpt == "" {
				excerpt = stripHTML(article.Content)
				if len(excerpt) > 160 {
					excerpt = excerpt[:157] + "..."
				}
			}

			// Build meta tags injection
			var seoInjection strings.Builder
			seoInjection.WriteString(fmt.Sprintf("\n  <title>%s | Buya Muhammad Elvisyam</title>", article.Title))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta name=\"description\" content=\"%s\" />", excerpt))
			seoInjection.WriteString("\n  <meta property=\"og:type\" content=\"article\" />")
			seoInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:title\" content=\"%s\" />", article.Title))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:description\" content=\"%s\" />", excerpt))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:image\" content=\"%s\" />", coverImage))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta property=\"og:url\" content=\"%s\" />", fullURL))
			seoInjection.WriteString("\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />")
			seoInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:title\" content=\"%s\" />", article.Title))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:description\" content=\"%s\" />", excerpt))
			seoInjection.WriteString(fmt.Sprintf("\n  <meta name=\"twitter:image\" content=\"%s\" />", coverImage))
			seoInjection.WriteString("\n")

			// Inject right before </head>
			htmlContent = strings.Replace(htmlContent, "</head>", seoInjection.String()+"</head>", 1)
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

func GetSitemap(c *fiber.Ctx) error {
	db := database.DB
	var articles []models.Article
	var pages []models.Page
	var categories []models.Category

	db.Where("status = ?", "published").Find(&articles)
	db.Find(&pages)
	db.Find(&categories)

	baseURL := "https://blogustad.com" // Update this as needed

	xml := `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

	// Homepage
	xml += fmt.Sprintf(`
  <url>
    <loc>%s/</loc>
    <lastmod>%s</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`, baseURL, time.Now().Format("2006-01-02"))

	// Articles
	for _, a := range articles {
		slug := a.Slug
		if slug == "" {
			slug = a.ID.String()
		}
		xml += fmt.Sprintf(`
  <url>
    <loc>%s/artikel/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`, baseURL, slug, a.UpdatedAt.Format("2006-01-02"))
	}

	// Categories
	for _, cat := range categories {
		xml += fmt.Sprintf(`
  <url>
    <loc>%s/kategori/%s</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`, baseURL, cat.Slug)
	}

	// Dynamic Pages
	for _, p := range pages {
		xml += fmt.Sprintf(`
  <url>
    <loc>%s/p/%s</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`, baseURL, p.Slug)
	}

	xml += "\n</urlset>"

	c.Set("Content-Type", "application/xml")
	return c.SendString(xml)
}
