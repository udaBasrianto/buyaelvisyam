package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
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
