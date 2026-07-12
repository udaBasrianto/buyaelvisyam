package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"net"
	"net/url"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

type WPImportRequest struct {
	Action     string `json:"action"`
	WpUrl      string `json:"wpUrl"`
	CategoryId string `json:"categoryId,omitempty"`
	After      string `json:"after,omitempty"`
	Before     string `json:"before,omitempty"`
}

type WPCategory struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Slug  string `json:"slug"`
	Count int    `json:"count"`
}

type WPPost struct {
	ID      int `json:"id"`
	Date    string `json:"date"`
	Slug    string `json:"slug"`
	Status  string `json:"status"`
	Link    string `json:"link"`
	Title   struct {
		Rendered string `json:"rendered"`
	} `json:"title"`
	Content struct {
		Rendered string `json:"rendered"`
	} `json:"content"`
	Excerpt struct {
		Rendered string `json:"rendered"`
	} `json:"excerpt"`
	Author         int   `json:"author"`
	FeaturedMedia  int   `json:"featured_media"`
	Categories     []int `json:"categories"`
}

type WPMedia struct {
	SourceUrl string `json:"source_url"`
}

// Case-insensitive header grabber
func getHeader(h http.Header, key string) string {
	lowKey := strings.ToLower(key)
	for k, v := range h {
		if strings.ToLower(k) == lowKey && len(v) > 0 {
			return v[0]
		}
	}
	return ""
}

func fetchWP(url string) (*http.Response, error) {
	client := &http.Client{
		Timeout: 60 * time.Second,
	}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9,id;q=0.8")
	req.Header.Set("Referer", url)
	
	fmt.Printf("[WP_FETCH] URL: %s\n", url)
	return client.Do(req)
}

func ImportWordPress(c *fiber.Ctx) error {
	var req WPImportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	wpUrl := strings.TrimSuffix(req.WpUrl, "/")
	if wpUrl == "" {
		return c.Status(400).JSON(fiber.Map{"error": "URL cannot be empty"})
	}

	db := database.DB

	if req.Action == "categories" {
		var allCategories []WPCategory
		page := 1
		for {
			url := fmt.Sprintf("%s/wp-json/wp/v2/categories?per_page=100&page=%d", wpUrl, page)
			resp, err := fetchWP(url)
			if err != nil {
				break
			}
			
			var cats []WPCategory
			if err := json.NewDecoder(resp.Body).Decode(&cats); err != nil {
				resp.Body.Close()
				break
			}
			
			totalPages, _ := strconv.Atoi(getHeader(resp.Header, "X-WP-TotalPages"))
			resp.Body.Close()
			allCategories = append(allCategories, cats...)
			
			if page >= totalPages || totalPages == 0 || len(cats) == 0 {
				break
			}
			page++
		}

		return c.JSON(fiber.Map{"categories": allCategories})
	}

	if req.Action == "import" {
		// Preparation: Fetch all WP categories for mapping
		wpCatMap := make(map[int]WPCategory)
		
		page := 1
		for {
			url := fmt.Sprintf("%s/wp-json/wp/v2/categories?per_page=100&page=%d", wpUrl, page)
			resp, err := fetchWP(url)
			if err != nil { break }
			var cats []WPCategory
			if err := json.NewDecoder(resp.Body).Decode(&cats); err != nil {
				resp.Body.Close()
				break
			}
			totalPages, _ := strconv.Atoi(getHeader(resp.Header, "X-WP-TotalPages"))
			resp.Body.Close()
			for _, cat := range cats {
				wpCatMap[cat.ID] = cat
				
				// Force Sync ALL WP Categories to Local DB so they appear in Menu
				var localCat models.Category
				if err := db.Where("slug = ?", cat.Slug).First(&localCat).Error; err != nil {
					localCat = models.Category{
						ID:        uuid.New(),
						Name:      html.UnescapeString(cat.Name),
						Slug:      cat.Slug,
						IsActive:  true,
						CreatedAt: time.Now(),
						UpdatedAt: time.Now(),
					}
					db.Create(&localCat)
				}
			}
			if page >= totalPages || totalPages == 0 || len(cats) == 0 { break }
			page++
		}

		targetCategoryName := "Umum"
		if req.CategoryId != "" && req.CategoryId != "all" {
			cUrl := fmt.Sprintf("%s/wp-json/wp/v2/categories/%s", wpUrl, req.CategoryId)
			if resp, err := fetchWP(cUrl); err == nil {
				var cat WPCategory
				if err := json.NewDecoder(resp.Body).Decode(&cat); err == nil {
					targetCategoryName = cat.Name
					// Sync this specific category locally
					var localCat models.Category
					if err := db.Where("slug = ?", cat.Slug).First(&localCat).Error; err != nil {
						localCat = models.Category{
							ID:        uuid.New(),
							Name:      cat.Name,
							Slug:      cat.Slug,
							IsActive:  true,
							CreatedAt: time.Now(),
							UpdatedAt: time.Now(),
						}
						db.Create(&localCat)
					}
				}
				resp.Body.Close()
			}
		}

		var firstAdmin models.Profile
		db.Where("role = ?", "admin").First(&firstAdmin)
		if firstAdmin.UserID == uuid.Nil { db.First(&firstAdmin) }

		imported := 0
		skipped := 0
		totalPostsFound := 0
		totalPages := 1
		perPage := 50

		for page := 1; page <= totalPages; page++ {
			url := fmt.Sprintf("%s/wp-json/wp/v2/posts?per_page=%d&page=%d", wpUrl, perPage, page)
			if req.CategoryId != "" && req.CategoryId != "all" {
				url += "&categories=" + req.CategoryId
			}
			if req.After != "" { url += "&after=" + req.After }
			if req.Before != "" { url += "&before=" + req.Before }

			resp, err := fetchWP(url)
			if err != nil { break }

			if page == 1 {
				totalPostsFound, _ = strconv.Atoi(getHeader(resp.Header, "X-WP-Total"))
				totalPages, _ = strconv.Atoi(getHeader(resp.Header, "X-WP-TotalPages"))
			}

			var posts []WPPost
			if err := json.NewDecoder(resp.Body).Decode(&posts); err != nil {
				resp.Body.Close()
				break
			}
			resp.Body.Close()

			if len(posts) == 0 { break }

			for _, wpPost := range posts {
				var existing models.Article
				// Check for duplicates by WP ID OR slug
				if err := db.Where("wp_id = ? OR slug = ?", wpPost.ID, wpPost.Slug).First(&existing).Error; err == nil {
					skipped++
					continue
				}

				// DETECT CATEGORY FOR THIS POST
				currentArtCategory := targetCategoryName
				if len(wpPost.Categories) > 0 {
					// Always try to use the actual specific category the post belongs to (first one)
					wpCID := wpPost.Categories[0]
					if wpCat, ok := wpCatMap[wpCID]; ok {
						currentArtCategory = html.UnescapeString(wpCat.Name)
					}
				}

				coverImage := "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop"
				if wpPost.FeaturedMedia > 0 {
					mediaUrl := fmt.Sprintf("%s/wp-json/wp/v2/media/%d", wpUrl, wpPost.FeaturedMedia)
					if mResp, err := fetchWP(mediaUrl); err == nil {
						var media WPMedia
						if err := json.NewDecoder(mResp.Body).Decode(&media); err == nil && media.SourceUrl != "" {
							coverImage = media.SourceUrl
						}
						mResp.Body.Close()
					}
				}

				createdAt, _ := time.Parse("2006-01-02T15:04:05", wpPost.Date)
				article := models.Article{
					ID:         uuid.New(),
					Title:      html.UnescapeString(wpPost.Title.Rendered),
					Slug:       wpPost.Slug,
					Content:    html.UnescapeString(wpPost.Content.Rendered),
					Excerpt:    html.UnescapeString(wpPost.Excerpt.Rendered),
					Category:   currentArtCategory,
					CoverImage: coverImage,
					Status:     "published",
					AuthorID:   firstAdmin.UserID,
					WPID:       wpPost.ID,
					CreatedAt:  createdAt,
					UpdatedAt:  time.Now(),
				}

				if err := db.Create(&article).Error; err != nil {
					skipped++
					continue
				}
				imported++
			}
		}

		return c.JSON(fiber.Map{
			"imported": imported,
			"skipped":  skipped,
			"total":    totalPostsFound,
		})
	}

	return c.Status(400).JSON(fiber.Map{"error": "Invalid action"})
}

type ExportImportRequest struct {
	BaseURL  string `json:"base_url"`
	Since    string `json:"since,omitempty"`
	Mode     string `json:"mode,omitempty"` // skip | upsert
	Limit    int    `json:"limit,omitempty"`
	MaxPages int    `json:"max_pages,omitempty"`
}

type exportListResponse struct {
	NextPage int                 `json:"next_page"`
	Items    []exportArticleItem `json:"items"`
}

type exportArticleItem struct {
	Title        string   `json:"title"`
	Slug         string   `json:"slug"`
	Content      string   `json:"content"`
	Excerpt      string   `json:"excerpt"`
	CoverImage   string   `json:"cover_image"`
	Categories   []string `json:"categories"`
	Tags         []string `json:"tags"`
	IsFeatured   bool     `json:"is_featured"`
	LocationName string   `json:"location_name"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	YoutubeURL   string   `json:"youtube_url"`
	CreatedAt    string   `json:"created_at"`
	UpdatedAt    string   `json:"updated_at"`
}

type legacyArticlesItem struct {
	Title        string   `json:"title"`
	Slug         string   `json:"slug"`
	Content      string   `json:"content"`
	Excerpt      string   `json:"excerpt"`
	CoverImage   string   `json:"cover_image"`
	Category     string   `json:"category"`
	Categories   []string `json:"categories"`
	Tags         []string `json:"tags"`
	Status       string   `json:"status"`
	IsFeatured   bool     `json:"is_featured"`
	LocationName string   `json:"location_name"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
	YoutubeURL   string   `json:"youtube_url"`
	CreatedAt    string   `json:"created_at"`
	UpdatedAt    string   `json:"updated_at"`
}

func ImportExportV1(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	authorID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req ExportImportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	baseURL := strings.TrimSpace(req.BaseURL)
	baseURL = strings.TrimSuffix(baseURL, "/")
	if baseURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "base_url wajib diisi"})
	}

	u, err := url.Parse(baseURL)
	if err == nil && u.Scheme == "" {
		u, err = url.Parse("https://" + baseURL)
		if err == nil {
			baseURL = strings.TrimSuffix("https://"+strings.TrimPrefix(baseURL, "//"), "/")
		}
	}
	if err != nil || u.Scheme == "" || u.Host == "" {
		return c.Status(400).JSON(fiber.Map{"error": "base_url tidak valid (contoh: https://domain.com)"})
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return c.Status(400).JSON(fiber.Map{"error": "base_url harus http/https"})
	}

	isSupabase := false
	if strings.Contains(strings.ToLower(baseURL), "kajiansunnah.lovable.app") {
		baseURL = "https://unidkjwwftehyxjfgjom.supabase.co/rest/v1"
		isSupabase = true
		u, _ = url.Parse(baseURL)
	} else if strings.Contains(strings.ToLower(baseURL), "supabase.co") {
		isSupabase = true
	}

	host := strings.TrimSpace(strings.ToLower(u.Hostname()))
	if host == "" {
		return c.Status(400).JSON(fiber.Map{"error": "base_url tidak valid"})
	}
	if ip := net.ParseIP(host); ip != nil {
		if !ip.IsLoopback() && ip.IsPrivate() {
			return c.Status(400).JSON(fiber.Map{"error": "base_url tidak diizinkan"})
		}
	}

	mode := strings.ToLower(strings.TrimSpace(req.Mode))
	if mode == "" {
		mode = "skip"
	}
	if mode != "skip" && mode != "upsert" {
		return c.Status(400).JSON(fiber.Map{"error": "mode harus 'skip' atau 'upsert'"})
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	maxPages := req.MaxPages
	if maxPages <= 0 {
		maxPages = 20
	}
	if maxPages > 200 {
		maxPages = 200
	}

	since := strings.TrimSpace(req.Since)
	if since != "" {
		if _, err := time.Parse(time.RFC3339, since); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "since harus format RFC3339"})
		}
	}

	client := &http.Client{Timeout: 45 * time.Second}
	db := database.DB

	imported := 0
	updated := 0
	skipped := 0
	failed := 0

	parseTime := func(s string) time.Time {
		s = strings.TrimSpace(s)
		if s == "" {
			return time.Time{}
		}
		if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
			return t
		}
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			return t
		}
		return time.Time{}
	}

	process := func(slug, title, content, excerpt, coverImage string, categories, tags []string, isFeatured bool, locationName string, lat, lng float64, youtubeURL string, createdAt time.Time) {
		slug = strings.TrimSpace(slug)
		title = strings.TrimSpace(title)
		if slug == "" || title == "" {
			failed++
			return
		}

		category := "Umum"
		if len(categories) > 0 && strings.TrimSpace(categories[0]) != "" {
			category = strings.TrimSpace(categories[0])
		} else {
			categories = []string{category}
		}

		if createdAt.IsZero() {
			createdAt = time.Now()
		}

		var existing models.Article
		if err := db.Where("slug = ?", slug).First(&existing).Error; err == nil {
			if mode == "skip" {
				skipped++
				return
			}

			existing.Title = title
			existing.Content = content
			existing.Excerpt = excerpt
			existing.CoverImage = coverImage
			existing.Category = category
			existing.Categories = categories
			existing.Tags = tags
			existing.IsFeatured = isFeatured
			existing.LocationName = locationName
			existing.Latitude = lat
			existing.Longitude = lng
			existing.YoutubeURL = youtubeURL
			existing.Status = "published"

			if err := db.Save(&existing).Error; err != nil {
				failed++
				return
			}
			updated++
			return
		}

		article := models.Article{
			ID:           uuid.New(),
			Title:        title,
			Slug:         slug,
			Content:      content,
			Excerpt:      excerpt,
			CoverImage:   coverImage,
			Category:     category,
			Categories:   categories,
			Tags:         tags,
			Status:       "published",
			IsFeatured:   isFeatured,
			LocationName: locationName,
			Latitude:     lat,
			Longitude:    lng,
			YoutubeURL:   youtubeURL,
			AuthorID:     authorID,
			CreatedAt:    createdAt,
			UpdatedAt:    time.Now(),
		}

		if err := db.Create(&article).Error; err != nil {
			failed++
			return
		}
		imported++
	}

	importLegacy := func() *fiber.Error {
		var legacyURL *url.URL
		if isSupabase {
			legacyURL, _ = url.Parse(baseURL + "/articles")
			q := legacyURL.Query()
			q.Set("select", "*")
			legacyURL.RawQuery = q.Encode()
		} else {
			legacyURL, _ = url.Parse(baseURL + "/api/articles")
			q := legacyURL.Query()
			q.Set("status", "published")
			q.Set("limit", "1000")
			legacyURL.RawQuery = q.Encode()
		}

		reqObj, err := http.NewRequest("GET", legacyURL.String(), nil)
		if err != nil {
			return fiber.NewError(502, "Gagal membuat request")
		}
		reqObj.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqObj.Header.Set("Accept", "application/json")
		if isSupabase {
			supabaseKey := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWRrand3ZnRlaHl4amZnam9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNDQ3ODksImV4cCI6MjA5MTcyMDc4OX0.8U9t6tPWN8tQcnuA1dbmFDjNIQbaXIifC3b_M55iWIU"
			reqObj.Header.Set("apikey", supabaseKey)
			reqObj.Header.Set("Authorization", "Bearer "+supabaseKey)
		}

		resp, err := client.Do(reqObj)
		if err != nil {
			return fiber.NewError(502, "Gagal mengambil data dari sumber: " + err.Error())
		}
		if resp.Body == nil {
			return fiber.NewError(502, "Response sumber kosong")
		}
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			resp.Body.Close()
			return fiber.NewError(502, "Sumber mengembalikan status tidak valid")
		}

		var items []legacyArticlesItem
		if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
			resp.Body.Close()
			return fiber.NewError(502, "Gagal membaca response sumber")
		}
		resp.Body.Close()

		var sinceTime time.Time
		if since != "" {
			sinceTime, _ = time.Parse(time.RFC3339, since)
		}

		for _, it := range items {
			if it.Status != "" && it.Status != "published" {
				continue
			}
			if sinceTime.IsZero() == false {
				ut := parseTime(it.UpdatedAt)
				if ut.IsZero() == false && ut.Before(sinceTime) {
					continue
				}
			}

			cats := it.Categories
			if len(cats) == 0 && strings.TrimSpace(it.Category) != "" {
				cats = []string{strings.TrimSpace(it.Category)}
			}

			process(
				it.Slug,
				it.Title,
				it.Content,
				it.Excerpt,
				it.CoverImage,
				cats,
				it.Tags,
				it.IsFeatured,
				it.LocationName,
				it.Latitude,
				it.Longitude,
				it.YoutubeURL,
				parseTime(it.CreatedAt),
			)
		}

		return nil
	}

	if isSupabase {
		if ferr := importLegacy(); ferr != nil {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.JSON(fiber.Map{
			"imported": imported,
			"updated":  updated,
			"skipped":  skipped,
			"failed":   failed,
			"source":   "supabase",
		})
	}

	page := 1
	for page != 0 && page <= maxPages {
		exportURL, _ := url.Parse(baseURL + "/api/export/v1/articles")
		q := exportURL.Query()
		q.Set("page", strconv.Itoa(page))
		q.Set("limit", strconv.Itoa(limit))
		q.Set("include_content", "true")
		if since != "" {
			q.Set("since", since)
		}
		exportURL.RawQuery = q.Encode()

		reqObj, err := http.NewRequest("GET", exportURL.String(), nil)
		if err != nil {
			return c.Status(502).JSON(fiber.Map{"error": "Gagal membuat request"})
		}
		reqObj.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqObj.Header.Set("Accept", "application/json")

		resp, err := client.Do(reqObj)
		if err != nil {
			return c.Status(502).JSON(fiber.Map{"error": "Gagal mengambil data dari sumber: " + err.Error()})
		}
		var parsed exportListResponse
		if resp.Body != nil {
			if resp.StatusCode == 404 && page == 1 {
				resp.Body.Close()
				if ferr := importLegacy(); ferr != nil {
					return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
				}
				return c.JSON(fiber.Map{
					"imported": imported,
					"updated":  updated,
					"skipped":  skipped,
					"failed":   failed,
					"source":   "legacy",
				})
			}
			if resp.StatusCode < 200 || resp.StatusCode >= 300 {
				resp.Body.Close()
				return c.Status(502).JSON(fiber.Map{"error": "Sumber mengembalikan status tidak valid"})
			}
			if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
				resp.Body.Close()
				return c.Status(502).JSON(fiber.Map{"error": "Gagal membaca response sumber"})
			}
			resp.Body.Close()
		} else {
			return c.Status(502).JSON(fiber.Map{"error": "Response sumber kosong"})
		}

		for _, item := range parsed.Items {
			process(
				item.Slug,
				item.Title,
				item.Content,
				item.Excerpt,
				item.CoverImage,
				item.Categories,
				item.Tags,
				item.IsFeatured,
				item.LocationName,
				item.Latitude,
				item.Longitude,
				item.YoutubeURL,
				parseTime(item.CreatedAt),
			)
		}

		if parsed.NextPage <= 0 {
			break
		}
		page = parsed.NextPage
	}

	return c.JSON(fiber.Map{
		"imported": imported,
		"updated":  updated,
		"skipped":  skipped,
		"failed":   failed,
		"source":   "export",
	})
}
