package handlers

import (
	"fmt"
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/golang-jwt/jwt/v4"
)

// --- Enrollment Handlers ---
func EnrollCourse(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	courseID, _ := uuid.Parse(c.Params("id"))

	// Check if already enrolled
	var existing models.Enrollment
	if err := database.DB.Where("user_id = ? AND course_id = ?", userID, courseID).First(&existing).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Anda sudah terdaftar di kursus ini"})
	}

	// Get course price
	var course models.Course
	if err := database.DB.Where("id = ?", courseID).First(&course).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kursus tidak ditemukan"})
	}

	status := "active"
	if course.Price > 0 {
		status = "pending"
	}

	enrollment := models.Enrollment{
		ID:        uuid.New(),
		UserID:    userID,
		CourseID:  courseID,
		Status:    status,
	}

	if err := database.DB.Create(&enrollment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mendaftar kursus"})
	}

	return c.JSON(enrollment)
}

func GetCheckEnrollment(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))
	
	courseID, _ := uuid.Parse(c.Params("id"))

	var enrollment models.Enrollment
	if err := database.DB.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		return c.JSON(fiber.Map{"enrolled": false})
	}

	return c.JSON(fiber.Map{"enrolled": true, "status": enrollment.Status})
}

// --- Admin Enrollment Management ---
func GetAllEnrollments(c *fiber.Ctx) error {
	type EnrollmentResult struct {
		models.Enrollment
		UserEmail   string  `json:"user_email"`
		DisplayName string  `json:"display_name"`
		CourseTitle string  `json:"course_title"`
		CoursePrice float64 `json:"course_price"`
	}

	var results []EnrollmentResult
	database.DB.Table("enrollments").
		Select("enrollments.*, profiles.email as user_email, profiles.display_name, courses.title as course_title, courses.price as course_price").
		Joins("left join profiles on profiles.user_id = enrollments.user_id").
		Joins("left join courses on courses.id = enrollments.course_id").
		Order("enrollments.created_at desc").
		Scan(&results)

	return c.JSON(results)
}

func UpdateEnrollmentStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if err := database.DB.Model(&models.Enrollment{}).Where("id = ?", id).Update("status", body.Status).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui status pendaftaran"})
	}

	return c.JSON(fiber.Map{"message": "Status pendaftaran diperbarui"})
}

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
	
	// 1. Get all modules of this course
	var modules []models.CourseModule
	database.DB.Where("course_id = ?", id).Find(&modules)
	
	// 2. Delete all lessons of those modules
	for _, m := range modules {
		database.DB.Where("module_id = ?", m.ID).Delete(&models.Lesson{})
	}
	
	// 3. Delete modules
	database.DB.Where("course_id = ?", id).Delete(&models.CourseModule{})
	
	// 4. Delete enrollments
	database.DB.Where("course_id = ?", id).Delete(&models.Enrollment{})

	// 5. Finally delete the course
	if err := database.DB.Delete(&models.Course{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus kursus"})
	}
	
	return c.JSON(fiber.Map{"message": "Kursus dan semua materi terkait telah dihapus"})
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

	// Access Control
	var module models.CourseModule
	database.DB.Select("course_id").Where("id = ?", lesson.ModuleID).First(&module)

	var course models.Course
	database.DB.Select("price").Where("id = ?", module.CourseID).First(&course)

	if course.Price > 0 {
		// Verify Login
		userToken, ok := c.Locals("user").(*jwt.Token)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "Login diperlukan untuk akses materi berbayar", "locked": true})
		}
		
		claims := userToken.Claims.(jwt.MapClaims)
		userID, _ := uuid.Parse(claims["user_id"].(string))
		role := claims["role"].(string)

		// Admin/Superadmin bypass
		if role == "admin" || role == "superadmin" {
			return c.JSON(lesson)
		}

		// Check enrollment for normal users
		var enrollment models.Enrollment
		if err := database.DB.Where("user_id = ? AND course_id = ? AND status = ?", userID, module.CourseID, "active").First(&enrollment).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{"error": "Akses ditolak. Silakan beli kursus ini terlebih dahulu.", "locked": true})
		}
	}

	return c.JSON(lesson)
}
