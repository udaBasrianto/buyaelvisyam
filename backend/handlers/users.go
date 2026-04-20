package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetUsers(c *fiber.Ctx) error {
	db := database.DB
	var profiles []models.Profile
	
	if err := db.Find(&profiles).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch users"})
	}

	// Fetch roles and article counts for each user
	type UserResponse struct {
		models.Profile
		Role     string `json:"role"`
		Articles int    `json:"articles"`
	}

	var response []UserResponse
	for _, p := range profiles {
		var role models.UserRole
		db.Where("user_id = ?", p.UserID).First(&role)

		var count int64
		db.Model(&models.Article{}).Where("author_id = ?", p.UserID).Count(&count)

		response = append(response, UserResponse{
			Profile:  p,
			Role:     role.Role,
			Articles: int(count),
		})
	}

	return c.JSON(response)
}

func UpdateUserRole(c *fiber.Ctx) error {
	id := c.Params("id")
	type RoleInput struct {
		Role string `json:"role"`
	}
	var input RoleInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	if err := db.Model(&models.UserRole{}).Where("user_id = ?", id).Update("role", input.Role).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update role"})
	}

	return c.JSON(fiber.Map{"message": "Role updated successfully"})
}

func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB

	// Delete role and profile
	db.Where("user_id = ?", id).Delete(&models.UserRole{})
	if err := db.Where("user_id = ?", id).Delete(&models.Profile{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete user"})
	}

	return c.JSON(fiber.Map{"message": "User deleted successfully"})
}
