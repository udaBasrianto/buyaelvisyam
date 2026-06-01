package handlers

import (
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func GetComments(c *fiber.Ctx) error {
	db := database.DB
	var comments []models.Comment

	articleID := c.Query("article_id")
	userID := c.Query("user_id")

	query := db.Order("created_at desc")
	if articleID != "" {
		query = query.Where("article_id = ?", articleID)
	}
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	query.Find(&comments)

	for i := range comments {
		var p models.Profile
		if err := db.Where("user_id = ?", comments[i].UserID).First(&p).Error; err == nil {
			comments[i].DisplayName = p.DisplayName
			words := strings.Fields(p.DisplayName)
			if len(words) > 0 {
				initials := ""
				for j := 0; j < len(words) && j < 2; j++ {
					if len(words[j]) > 0 {
						initials += string(words[j][0])
					}
				}
				comments[i].Initials = strings.ToUpper(initials)
			}
		}
		if comments[i].DisplayName == "" {
			comments[i].DisplayName = "Anonim"
			comments[i].Initials = "AN"
		}

		var art models.Article
		if err := db.Select("title").Where("id = ?", comments[i].ArticleID).First(&art).Error; err == nil {
			comments[i].ArticleTitle = art.Title
		}
	}

	return c.JSON(comments)
}

func CreateComment(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr := claims["user_id"].(string)

	var comment models.Comment
	if err := c.BodyParser(&comment); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if comment.ArticleID == uuid.Nil {
		return c.Status(400).JSON(fiber.Map{"error": "Article ID wajib diisi"})
	}
	comment.Content = strings.TrimSpace(comment.Content)
	if comment.Content == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Komentar tidak boleh kosong"})
	}

	comment.ID = uuid.New()
	comment.UserID = userID
	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()

	db := database.DB
	if err := db.Create(&comment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create comment"})
	}

	return c.JSON(comment)
}

func DeleteComment(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)

	var comment models.Comment
	if err := db.Where("id = ?", id).First(&comment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Comment not found"})
	}

	if role != "admin" && comment.UserID.String() != userIDStr {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}

	if err := db.Delete(&comment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete comment"})
	}

	return c.JSON(fiber.Map{"message": "Comment deleted successfully"})
}

func UpdateComment(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	var comment models.Comment
	if err := db.Where("id = ?", id).First(&comment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Comment not found"})
	}

	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userIDStr, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	if role != "admin" && comment.UserID.String() != userIDStr {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	content := strings.TrimSpace(body.Content)
	if content == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Komentar tidak boleh kosong"})
	}

	comment.Content = content
	comment.UpdatedAt = time.Now()
	if err := db.Save(&comment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update comment"})
	}

	return c.JSON(comment)
}
