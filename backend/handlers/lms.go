package handlers

import (
	"fmt"
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// --- Course Handlers ---
func GetCourses(c *fiber.Ctx) error {
	var courses []models.Course
	database.DB.Order("created_at desc").Find(&courses)
	return c.JSON(courses)
}

func GetCourseBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var course models.Course
	if err := database.DB.Where("slug = ?", slug).First(&course).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kursus tidak ditemukan"})
	}
	return c.JSON(course)
}

func CreateCourse(c *fiber.Ctx) error {
	fmt.Println("[LMS] Attempting to create course...")
	var course models.Course
	if err := c.BodyParser(&course); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data salah"})
	}
	course.ID = uuid.New()
	if err := database.DB.Create(&course).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat kursus"})
	}
	return c.JSON(course)
}

func UpdateCourse(c *fiber.Ctx) error {
	id := c.Params("id")
	var course models.Course
	if err := database.DB.Where("id = ?", id).First(&course).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kursus tidak ditemukan"})
	}
	if err := c.BodyParser(&course); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data salah"})
	}
	database.DB.Save(&course)
	return c.JSON(course)
}

func DeleteCourse(c *fiber.Ctx) error {
	id := c.Params("id")
	database.DB.Delete(&models.Course{}, "id = ?", id)
	return c.JSON(fiber.Map{"message": "Kursus dihapus"})
}

// --- Module Handlers ---
func GetModules(c *fiber.Ctx) error {
	courseID := c.Params("courseId")
	var modules []models.CourseModule
	database.DB.Where("course_id = ?", courseID).Order("sort_order asc").Find(&modules)
	return c.JSON(modules)
}

func CreateModule(c *fiber.Ctx) error {
	var module models.CourseModule
	if err := c.BodyParser(&module); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data salah"})
	}
	module.ID = uuid.New()
	database.DB.Create(&module)
	return c.JSON(module)
}

// --- Lesson Handlers ---
func GetLessons(c *fiber.Ctx) error {
	moduleID := c.Params("moduleId")
	var lessons []models.Lesson
	database.DB.Where("module_id = ?", moduleID).Order("sort_order asc").Find(&lessons)
	return c.JSON(lessons)
}

func CreateLesson(c *fiber.Ctx) error {
	var lesson models.Lesson
	if err := c.BodyParser(&lesson); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data salah"})
	}
	lesson.ID = uuid.New()
	database.DB.Create(&lesson)
	return c.JSON(lesson)
}

func GetLessonBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var lesson models.Lesson
	if err := database.DB.Where("slug = ?", slug).First(&lesson).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Materi tidak ditemukan"})
	}
	return c.JSON(lesson)
}
