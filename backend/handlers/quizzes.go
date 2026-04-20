package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func GetArticleQuiz(c *fiber.Ctx) error {
	articleID := c.Params("articleId")
	db := database.DB
	var questions []models.QuizQuestion

	if err := db.Where("article_id = ?", articleID).Order("created_at asc").Find(&questions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch quiz"})
	}

	return c.JSON(questions)
}

func SaveArticleQuiz(c *fiber.Ctx) error {
	articleIDStr := c.Params("articleId")
	articleID, err := uuid.Parse(articleIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid article ID"})
	}

	var questions []models.QuizQuestion
	if err := c.BodyParser(&questions); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	
	// Delete existing questions for this article
	db.Where("article_id = ?", articleID).Delete(&models.QuizQuestion{})

	// Save new questions
	for i := range questions {
		questions[i].ID = uuid.New()
		questions[i].ArticleID = articleID
		if err := db.Create(&questions[i]).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not save question"})
		}
	}

	return c.JSON(questions)
}
