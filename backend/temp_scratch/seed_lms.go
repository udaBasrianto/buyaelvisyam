package main

import (
	"backend/database"
	"backend/models"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	courseID := uuid.New()
	course := models.Course{
		ID:          courseID,
		Title:       "Kelas Dasar Aqidah Islam Akhlak",
		Slug:        "dasar-aqidah-islam",
		Description: "Pelajari dasar-dasar kepercayaan dalam Islam sesuai dengan Al-Quran dan As-Sunnah untuk memperkokoh iman.",
		Thumbnail:   "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop",
		Instructor:  "Ustadz Ahmad Fauzi",
		Level:       "Pemula",
		Category:    "Aqidah",
		IsPublished: true,
		Price:       0,
	}

	if err := database.DB.Create(&course).Error; err != nil {
		log.Printf("Gagal insert course: %v", err)
	}

	moduleID := uuid.New()
	module := models.CourseModule{
		ID:        moduleID,
		CourseID:  courseID,
		Title:     "Pilar-Pilar Iman",
		SortOrder: 1,
	}
	database.DB.Create(&module)

	lessons := []models.Lesson{
		{
			ID:          uuid.New(),
			ModuleID:    moduleID,
			Title:       "Apa itu Aqidah?",
			Slug:        "apa-itu-aqidah",
			ContentType: "video",
			Content:     "https://www.youtube.com/embed/dQw4w9WgXcQ", // Dummy
			Duration:    "12:30",
			SortOrder:   1,
			IsFree:      true,
		},
		{
			ID:          uuid.New(),
			ModuleID:    moduleID,
			Title:       "Makna Syahadatain",
			Slug:        "makna-syahadatain",
			ContentType: "text",
			Content:     "<h3>Makna Dua Kalimat Syahadat</h3><p>Penjelasan mendalam mengenai rukun pertama Islam...</p>",
			Duration:    "15:00",
			SortOrder:   2,
			IsFree:      false,
		},
	}

	for _, l := range lessons {
		database.DB.Create(&l)
	}

	fmt.Println("Sukses! Data LMS Perdana sudah masuk.")
}
