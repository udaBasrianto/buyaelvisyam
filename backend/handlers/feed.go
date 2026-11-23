package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetRSSFeed generates standard RSS 2.0 XML for feed readers, aggregators, and Google News
func GetRSSFeed(c *fiber.Ctx) error {
	db := database.DB
	var articles []models.Article
	if err := db.Where("status = ?", "published").Order("published_at desc").Limit(30).Find(&articles).Error; err != nil {
		return c.Status(500).SendString("Error generating RSS feed")
	}

	var settings models.SiteSettings
	db.First(&settings)

	siteTitle := settings.SiteName
	if siteTitle == "" {
		siteTitle = "Kajian & Artikel Ilmiah"
	}
	siteDesc := settings.SiteDescription
	if siteDesc == "" {
		siteDesc = settings.Tagline
	}
	if siteDesc == "" {
		siteDesc = "Portal Kajian dan Pembelajaran Ilmiah"
	}

	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL")), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(strings.TrimSpace(os.Getenv("SITE_URL")), "/")
	}
	if baseURL == "" {
		baseURL = strings.TrimRight(c.Protocol()+"://"+c.Hostname(), "/")
	}

	feedURL := baseURL + "/feed"
	lastBuildDate := time.Now().Format(time.RFC1123Z)
	if len(articles) > 0 && articles[0].PublishedAt != nil {
		lastBuildDate = articles[0].PublishedAt.Format(time.RFC1123Z)
	}

	var b strings.Builder
	b.WriteString("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
	b.WriteString("<rss version=\"2.0\"\n")
	b.WriteString("  xmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n")
	b.WriteString("  xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\"\n")
	b.WriteString("  xmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n")
	b.WriteString("  xmlns:atom=\"http://www.w3.org/2005/Atom\"\n")
	b.WriteString("  xmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n")
	b.WriteString("  xmlns:slash=\"http://purl.org/rss/1.0/modules/slash/\"\n")
	b.WriteString("  xmlns:media=\"http://search.yahoo.com/mrss/\">\n")
	b.WriteString("  <channel>\n")
	b.WriteString(fmt.Sprintf("    <title><![CDATA[%s]]></title>\n", siteTitle))
	b.WriteString(fmt.Sprintf("    <atom:link href=\"%s\" rel=\"self\" type=\"application/rss+xml\" />\n", feedURL))
	b.WriteString(fmt.Sprintf("    <link>%s</link>\n", baseURL))
	b.WriteString(fmt.Sprintf("    <description><![CDATA[%s]]></description>\n", siteDesc))
	b.WriteString(fmt.Sprintf("    <lastBuildDate>%s</lastBuildDate>\n", lastBuildDate))
	b.WriteString("    <language>id-ID</language>\n")
	b.WriteString("    <sy:updatePeriod>hourly</sy:updatePeriod>\n")
	b.WriteString("    <sy:updateFrequency>1</sy:updateFrequency>\n")
	b.WriteString("    <generator>Go-Fiber-BlogEngine</generator>\n")

	for _, a := range articles {
		slug := a.Slug
		if slug == "" {
			slug = a.ID.String()
		}
		itemURL := fmt.Sprintf("%s/artikel/%s", baseURL, slug)
		pubDate := a.CreatedAt.Format(time.RFC1123Z)
		if a.PublishedAt != nil {
			pubDate = a.PublishedAt.Format(time.RFC1123Z)
		}

		b.WriteString("    <item>\n")
		b.WriteString(fmt.Sprintf("      <title><![CDATA[%s]]></title>\n", a.Title))
		b.WriteString(fmt.Sprintf("      <link>%s</link>\n", itemURL))
		b.WriteString(fmt.Sprintf("      <guid isPermaLink=\"true\">%s</guid>\n", itemURL))
		b.WriteString(fmt.Sprintf("      <pubDate>%s</pubDate>\n", pubDate))
		if a.Category != "" {
			b.WriteString(fmt.Sprintf("      <category><![CDATA[%s]]></category>\n", a.Category))
		}
		if a.Excerpt != "" {
			b.WriteString(fmt.Sprintf("      <description><![CDATA[%s]]></description>\n", a.Excerpt))
		} else {
			b.WriteString(fmt.Sprintf("      <description><![CDATA[%s]]></description>\n", a.Title))
		}
		if a.Content != "" {
			b.WriteString(fmt.Sprintf("      <content:encoded><![CDATA[%s]]></content:encoded>\n", a.Content))
		}
		if a.CoverImage != "" {
			coverURL := a.CoverImage
			if strings.HasPrefix(coverURL, "/") {
				coverURL = baseURL + coverURL
			}
			b.WriteString(fmt.Sprintf("      <media:content url=\"%s\" medium=\"image\" />\n", coverURL))
			b.WriteString(fmt.Sprintf("      <enclosure url=\"%s\" type=\"image/jpeg\" length=\"0\" />\n", coverURL))
		}
		b.WriteString("    </item>\n")
	}

	b.WriteString("  </channel>\n")
	b.WriteString("</rss>\n")

	c.Set("Content-Type", "application/rss+xml; charset=UTF-8")
	return c.SendString(b.String())
}
