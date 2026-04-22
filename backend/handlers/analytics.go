package handlers

import (
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
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
	}
	var onlineUsers []OnlineUser
	fifteenMinsAgo := now.Add(-15 * time.Minute)
	
	db.Table("visits").
		Select("profiles.user_id as id, profiles.display_name, profiles.email, MAX(visits.created_at) as last_active, MAX(visits.path) as last_path").
		Joins("join profiles on profiles.user_id = visits.user_id").
		Where("visits.created_at >= ?", fifteenMinsAgo).
		Group("profiles.user_id, profiles.display_name, profiles.email").
		Order("last_active desc").
		Scan(&onlineUsers)

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
