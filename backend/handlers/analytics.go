package handlers

import (
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AnalyticsOverview struct {
	TotalViews     int64 `json:"total_views"`
	UniqueVisitors int64 `json:"unique_visitors"`
	ViewsGrowth    float64 `json:"views_growth"`
	VisitorGrowth  float64 `json:"visitor_growth"`
}

type DailyStat struct {
	Date   string `json:"date"`
	Views  int    `json:"views"`
	Unique int    `json:"unique"`
}

func GetAnalytics(c *fiber.Ctx) error {
	db := database.DB
	now := time.Now()
	
	// 1. Overview stats
	var totalViews int64
	db.Model(&models.Visit{}).Count(&totalViews)

	var uniqueVisitors int64
	db.Model(&models.Visit{}).Distinct("ip").Count(&uniqueVisitors)

	// Calculate Growth (compare last 30 days with previous 30 days)
	var currentViews, prevViews int64
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	sixtyDaysAgo := now.AddDate(0, 0, -60)
	
	db.Model(&models.Visit{}).Where("created_at >= ?", thirtyDaysAgo).Count(&currentViews)
	db.Model(&models.Visit{}).Where("created_at >= ? AND created_at < ?", sixtyDaysAgo, thirtyDaysAgo).Count(&prevViews)
	
	viewsGrowth := 0.0
	if prevViews > 0 {
		viewsGrowth = float64(currentViews-prevViews) / float64(prevViews) * 100
	} else if currentViews > 0 {
		viewsGrowth = 100.0
	}

	var currentVisitors, prevVisitors int64
	db.Model(&models.Visit{}).Where("created_at >= ?", thirtyDaysAgo).Distinct("ip").Count(&currentVisitors)
	db.Model(&models.Visit{}).Where("created_at >= ? AND created_at < ?", sixtyDaysAgo, thirtyDaysAgo).Distinct("ip").Count(&prevVisitors)
	
	visitorGrowth := 0.0
	if prevVisitors > 0 {
		visitorGrowth = float64(currentVisitors-prevVisitors) / float64(prevVisitors) * 100
	} else if currentVisitors > 0 {
		visitorGrowth = 100.0
	}

	// 2. Daily stats for the last 14 days (Efficient grouped query)
	type Result struct {
		Date   time.Time
		Views  int
		Unique int
	}
	var results []Result
	fourteenDaysAgo := now.AddDate(0, 0, -14)
	
	db.Table("visits").
		Select("DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT ip) as unique").
		Where("created_at >= ?", fourteenDaysAgo).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results)

	// Fill gaps for days with zero activity
	dailyStats := []DailyStat{}
	statsMap := make(map[string]Result)
	for _, r := range results {
		statsMap[r.Date.Format("2006-01-02")] = r
	}

	for i := 13; i >= 0; i-- {
		day := now.AddDate(0, 0, -i)
		dateKey := day.Format("2006-01-02")
		
		if val, ok := statsMap[dateKey]; ok {
			dailyStats = append(dailyStats, DailyStat{
				Date:   day.Format("02 Jan"),
				Views:  val.Views,
				Unique: val.Unique,
			})
		} else {
			dailyStats = append(dailyStats, DailyStat{
				Date:   day.Format("02 Jan"),
				Views:  0,
				Unique: 0,
			})
		}
	}

	// 3. Top Articles (last 30 days)
	var topArticles []models.Article
	db.Order("views desc").Limit(5).Find(&topArticles)

	// 4. Recent Visitors
	var recentVisits []models.Visit
	db.Order("created_at desc").Limit(15).Find(&recentVisits)

	// 5. Online Users (Active in last 15 minutes)
	type OnlineUser struct {
		ID          string    `json:"id"`
		DisplayName string    `json:"display_name"`
		Email       string    `json:"email"`
		LastActive  time.Time `json:"last_active"`
		LastPath    string    `json:"last_path"`
		IsGuest     bool      `json:"is_guest"`
	}
	var onlineUsers []OnlineUser
	fifteenMinsAgo := now.Add(-15 * time.Minute)
	
	// Get registered users
	var registeredOnline []OnlineUser
	db.Table("visits").
		Select("profiles.user_id as id, profiles.display_name, profiles.email, MAX(visits.created_at) as last_active, MAX(visits.path) as last_path, false as is_guest").
		Joins("join profiles on profiles.user_id = visits.user_id").
		Where("visits.created_at >= ?", fifteenMinsAgo).
		Group("profiles.user_id, profiles.display_name, profiles.email").
		Scan(&registeredOnline)

	// Get anonymous users (distinct by IP)
	var guestOnline []OnlineUser
	db.Table("visits").
		Select("ip as id, 'Guest (' || ip || ')' as display_name, '' as email, MAX(created_at) as last_active, MAX(path) as last_path, true as is_guest").
		Where("created_at >= ? AND user_id IS NULL", fifteenMinsAgo).
		Group("ip").
		Scan(&guestOnline)

	onlineUsers = append(registeredOnline, guestOnline...)

	return c.JSON(fiber.Map{
		"overview": AnalyticsOverview{
			TotalViews:     totalViews,
			UniqueVisitors: uniqueVisitors,
			ViewsGrowth:    viewsGrowth,
			VisitorGrowth:  visitorGrowth,
		},
		"daily_stats":     dailyStats,
		"top_articles":    topArticles,
		"recent_visitors": recentVisits,
		"online_users":    onlineUsers,
	})
}

func TrackVisit(c *fiber.Ctx) error {
	var body struct {
		Path     string `json:"path"`
		Referrer string `json:"referrer"`
		Title    string `json:"title"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	// Try to get user from JWT
	var userID *uuid.UUID
	// Note: You might want to extract userID from context if you have an auth middleware for tracking
	// For now, we'll keep it simple as the frontend VisitorTracker doesn't send Bearer token by default
	// unless we update it. But we can check it here too.

	// Save visit
	visit := models.Visit{
		ID:        uuid.New(),
		UserID:    userID,
		IP:        c.IP(),
		Path:      body.Path,
		UserAgent: c.Get("User-Agent"),
		CreatedAt: time.Now(),
	}
	database.DB.Create(&visit)

	return c.SendStatus(200)
}

func GetPublicStats(c *fiber.Ctx) error {
	db := database.DB

	// Total views = sum of all article view counts (this is the real data)
	var totalViews int64
	db.Model(&models.Article{}).Select("COALESCE(SUM(views), 0)").Scan(&totalViews)

	// Total article count as "visitors" proxy (since visits table may be empty)
	var totalArticles int64
	db.Model(&models.Article{}).Where("status = ?", "published").Count(&totalArticles)

	// Today's views: count articles updated today (approximate)
	// Better: count visits today if available, otherwise fallback to 0
	var todayViews int64
	today := time.Now().Format("2006-01-02")
	db.Model(&models.Visit{}).Where("DATE(created_at) = ?", today).Count(&todayViews)

	// Total unique visitors from visits table
	var totalVisitors int64
	db.Model(&models.Visit{}).Distinct("ip").Count(&totalVisitors)

	// Total active categories
	var totalCategories int64
	db.Model(&models.Category{}).Where("is_active = ?", true).Count(&totalCategories)

	return c.JSON(fiber.Map{
		"total_views":      totalViews,
		"today_views":      todayViews,
		"total_visitors":   totalVisitors,
		"total_articles":   totalArticles,
		"total_categories": totalCategories,
	})
}
