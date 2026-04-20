package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"github.com/gofiber/fiber/v2"
	"time"
)

func GetSitemap(c *fiber.Ctx) error {
	db := database.DB
	var articles []models.Article
	var pages []models.Page
	var categories []models.Category

	db.Where("status = ?", "published").Find(&articles)
	db.Find(&pages)
	db.Find(&categories)

	// Base URL - In production this should be the real domain
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
		if slug == "" { slug = a.ID.String() }
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
