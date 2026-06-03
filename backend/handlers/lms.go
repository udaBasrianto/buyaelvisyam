package handlers

import (
	"fmt"
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/golang-jwt/jwt/v4"
	"strings"
	"time"
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

	prevPublished := course.IsPublished

	var input struct {
		Title       *string  `json:"title"`
		Slug        *string  `json:"slug"`
		Description *string  `json:"description"`
		Thumbnail   *string  `json:"thumbnail"`
		Price       *float64 `json:"price"`
		Instructor  *string  `json:"instructor"`
		Level       *string  `json:"level"`
		Category    *string  `json:"category"`
		IsPublished *bool    `json:"is_published"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format data salah"})
	}

	updates := map[string]any{}
	if input.Title != nil { updates["title"] = strings.TrimSpace(*input.Title) }
	if input.Slug != nil { updates["slug"] = strings.TrimSpace(*input.Slug) }
	if input.Description != nil { updates["description"] = *input.Description }
	if input.Thumbnail != nil { updates["thumbnail"] = strings.TrimSpace(*input.Thumbnail) }
	if input.Price != nil { updates["price"] = *input.Price }
	if input.Instructor != nil { updates["instructor"] = strings.TrimSpace(*input.Instructor) }
	if input.Level != nil { updates["level"] = strings.TrimSpace(*input.Level) }
	if input.Category != nil { updates["category"] = strings.TrimSpace(*input.Category) }
	if input.IsPublished != nil { updates["is_published"] = *input.IsPublished }

	if err := database.DB.Model(&course).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui kursus"})
	}

	database.DB.Where("id = ?", id).First(&course)
	if !prevPublished && course.IsPublished {
		go func(cs models.Course) {
			defer func() { recover() }()
			NotifyWhatsAppNewCourse(cs)
		}(course)
	}

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

	userToken, ok := c.Locals("user").(*jwt.Token)
	if !ok || userToken == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Login diperlukan", "locked": true})
	}
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))
	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)

	if course.Price > 0 {
		// Admin/Superadmin bypass
		if role == "admin" || role == "superadmin" {
			return c.JSON(extendLessonResponse(module.CourseID, lesson, userID))
		}

		// Check enrollment for normal users
		var enrollment models.Enrollment
		if err := database.DB.Where("user_id = ? AND course_id = ? AND status = ?", userID, module.CourseID, "active").First(&enrollment).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{"error": "Akses ditolak. Silakan beli kursus ini terlebih dahulu.", "locked": true})
		}
	}

	return c.JSON(extendLessonResponse(module.CourseID, lesson, userID))
}

func extendLessonResponse(courseID uuid.UUID, lesson models.Lesson, userID uuid.UUID) fiber.Map {
	var course models.Course
	database.DB.Select("id, slug, title").Where("id = ?", courseID).First(&course)

	var modules []models.CourseModule
	database.DB.Where("course_id = ?", courseID).Order("sort_order asc, created_at asc").Find(&modules)

	var moduleIDs []uuid.UUID
	for _, m := range modules {
		moduleIDs = append(moduleIDs, m.ID)
	}

	var allLessons []models.Lesson
	if len(moduleIDs) > 0 {
		database.DB.Where("module_id IN ?", moduleIDs).Order("sort_order asc, created_at asc").Find(&allLessons)
	}

	type LessonNavItem struct {
		ID       uuid.UUID
		Slug     string
		ModuleID uuid.UUID
	}
	nav := make([]LessonNavItem, 0, len(allLessons))
	for _, l := range allLessons {
		nav = append(nav, LessonNavItem{ID: l.ID, Slug: l.Slug, ModuleID: l.ModuleID})
	}

	prevSlug := ""
	nextSlug := ""
	for i := range nav {
		if nav[i].ID == lesson.ID {
			if i > 0 {
				prevSlug = nav[i-1].Slug
			}
			if i < len(nav)-1 {
				nextSlug = nav[i+1].Slug
			}
			break
		}
	}

	completed := false
	var count int64
	database.DB.Model(&models.LessonProgress{}).
		Where("user_id = ? AND lesson_id = ?", userID, lesson.ID).
		Count(&count)
	completed = count > 0

	return fiber.Map{
		"id":           lesson.ID,
		"module_id":     lesson.ModuleID,
		"title":        lesson.Title,
		"slug":         lesson.Slug,
		"content_type":  lesson.ContentType,
		"content":      lesson.Content,
		"duration":     lesson.Duration,
		"sort_order":   lesson.SortOrder,
		"is_free":      lesson.IsFree,
		"created_at":   lesson.CreatedAt,
		"course_id":    course.ID,
		"course_slug":  course.Slug,
		"course_title": course.Title,
		"prev_slug":    prevSlug,
		"next_slug":    nextSlug,
		"is_completed": completed,
	}
}

func MarkLessonComplete(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	lessonIDStr := strings.TrimSpace(c.Params("lessonId"))
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lesson ID"})
	}

	var lesson models.Lesson
	if err := database.DB.Where("id = ?", lessonID).First(&lesson).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Materi tidak ditemukan"})
	}

	var module models.CourseModule
	database.DB.Select("course_id").Where("id = ?", lesson.ModuleID).First(&module)

	var course models.Course
	database.DB.Select("price").Where("id = ?", module.CourseID).First(&course)

	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)
	if course.Price > 0 && role != "admin" && role != "superadmin" {
		var enrollment models.Enrollment
		if err := database.DB.Where("user_id = ? AND course_id = ? AND status = ?", userID, module.CourseID, "active").First(&enrollment).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{"error": "Akses ditolak", "locked": true})
		}
	}

	db := database.DB
	var existing models.LessonProgress
	if err := db.Where("user_id = ? AND lesson_id = ?", userID, lessonID).First(&existing).Error; err == nil {
		return c.JSON(existing)
	}

	lp := models.LessonProgress{
		ID:          uuid.New(),
		UserID:      userID,
		LessonID:    lessonID,
		CompletedAt: time.Now(),
	}
	if err := db.Create(&lp).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan progres"})
	}
	return c.JSON(lp)
}

func UnmarkLessonComplete(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	lessonIDStr := strings.TrimSpace(c.Params("lessonId"))
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lesson ID"})
	}

	database.DB.Where("user_id = ? AND lesson_id = ?", userID, lessonID).Delete(&models.LessonProgress{})
	return c.JSON(fiber.Map{"message": "OK"})
}

func GetMyCourseProgress(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	courseIDStr := strings.TrimSpace(c.Params("id"))
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid course ID"})
	}

	var course models.Course
	if err := database.DB.Where("id = ?", courseID).First(&course).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kursus tidak ditemukan"})
	}

	role, _ := claims["role"].(string)
	role = strings.TrimSpace(role)
	if course.Price > 0 && role != "admin" && role != "superadmin" {
		var enrollment models.Enrollment
		if err := database.DB.Where("user_id = ? AND course_id = ? AND status = ?", userID, courseID, "active").First(&enrollment).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{"error": "Akses ditolak", "locked": true})
		}
	}

	var modules []models.CourseModule
	database.DB.Where("course_id = ?", courseID).Order("sort_order asc, created_at asc").Find(&modules)

	moduleIDs := make([]uuid.UUID, 0, len(modules))
	for _, m := range modules {
		moduleIDs = append(moduleIDs, m.ID)
	}

	var allLessons []models.Lesson
	if len(moduleIDs) > 0 {
		database.DB.Where("module_id IN ?", moduleIDs).Order("sort_order asc, created_at asc").Find(&allLessons)
	}

	lessonIDs := make([]uuid.UUID, 0, len(allLessons))
	for _, l := range allLessons {
		lessonIDs = append(lessonIDs, l.ID)
	}

	type Row struct {
		LessonID uuid.UUID
	}
	var rows []Row
	if len(lessonIDs) > 0 {
		database.DB.Model(&models.LessonProgress{}).
			Select("lesson_id").
			Where("user_id = ? AND lesson_id IN ?", userID, lessonIDs).
			Find(&rows)
	}

	completedSet := map[uuid.UUID]struct{}{}
	for _, r := range rows {
		completedSet[r.LessonID] = struct{}{}
	}

	completedIDs := make([]string, 0, len(completedSet))
	for id := range completedSet {
		completedIDs = append(completedIDs, id.String())
	}

	total := len(lessonIDs)
	completedCount := len(completedSet)
	percent := 0.0
	if total > 0 {
		percent = float64(completedCount) / float64(total) * 100
	}

	nextSlug := ""
	for _, l := range allLessons {
		if _, ok := completedSet[l.ID]; !ok {
			nextSlug = l.Slug
			break
		}
	}

	return c.JSON(fiber.Map{
		"course_id":        courseID,
		"total_lessons":    total,
		"completed_lessons": completedCount,
		"progress_percent": percent,
		"completed_lesson_ids": completedIDs,
		"next_lesson_slug": nextSlug,
	})
}
