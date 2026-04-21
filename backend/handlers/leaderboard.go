package handlers

import (
	"backend/database"
	"github.com/gofiber/fiber/v2"
)

type LeaderboardEntry struct {
	UserID      string  `json:"user_id"`
	DisplayName string  `json:"display_name"`
	Email       string  `json:"email"`
	AvatarURL   string  `json:"avatar_url"`
	TotalScore  float64 `json:"total_score"`
	TotalQuizzes int     `json:"total_quizzes"`
}

func GetLeaderboard(c *fiber.Ctx) error {
	var results []LeaderboardEntry

	// Kita hitung total skor dari tabel quiz_attempts (asumsi nama tabel)
	// Kita join dengan profiles untuk dapat nama dan foto
	err := database.DB.Table("quiz_attempts").
		Select("profiles.user_id, profiles.display_name, profiles.email, profiles.avatar_url, SUM(quiz_attempts.score) as total_score, COUNT(quiz_attempts.id) as total_quizzes").
		Joins("left join profiles on profiles.user_id = quiz_attempts.user_id").
		Group("profiles.user_id, profiles.display_name, profiles.email, profiles.avatar_url").
		Order("total_score desc").
		Limit(50).
		Scan(&results).Error

	if err != nil {
		// Jika tabel belum ada, kita kembalikan array kosong dulu supaya tidak error
		return c.JSON(fiber.Map{
			"status": "success",
			"data":   []LeaderboardEntry{},
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   results,
	})
}
