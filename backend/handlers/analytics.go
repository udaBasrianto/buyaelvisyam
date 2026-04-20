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

	// 1. Overview stats
	var totalViews int64
	db.Model(&models.Visit{}).Count(&totalViews)

	var uniqueVisitors int64
	db.Model(&models.Visit{}).Distinct("ip").Count(&uniqueVisitors)

	// 2. Daily stats for the last 14 days
	dailyStats := []DailyStat{}
	now := time.Now()
	for i := 13; i >= 0; i-- {
		day := now.AddDate(0, 0, -i)
		dateStr := day.Format("2006-01-02")
		
		var views int64
		db.Model(&models.Visit{}).Where("DATE(created_at) = ?", dateStr).Count(&views)
		
		var unique int64
		db.Model(&models.Visit{}).Where("DATE(created_at) = ?", dateStr).Distinct("ip").Count(&unique)
		
		dailyStats = append(dailyStats, DailyStat{
			Date:   day.Format("02 Jan"),
			Views:  int(views),
			Unique: int(unique),
		})
	}

	// 3. Top Articles
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
	fifteenMinsAgo := time.Now().Add(-15 * time.Minute)
	
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
			ViewsGrowth:    12.5, // Simulated growth
			VisitorGrowth:  8.2,  // Simulated growth
		},
		"daily_stats":     dailyStats,
		"top_articles":    topArticles,
		"recent_visitors": recentVisits,
		"online_users":    onlineUsers,
	})
}
