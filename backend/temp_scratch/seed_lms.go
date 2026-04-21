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
	// Load .env from current backend folder
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()

	// 1. CLEAR EXISTING LMS DATA (Optional, but good for clean seed)
	database.DB.Exec("DELETE FROM lessons")
	database.DB.Exec("DELETE FROM course_modules")
	database.DB.Exec("DELETE FROM courses")

	fmt.Println("Seeding LMS Data...")

	// 2. CREATE FREE COURSE
	freeCourse := models.Course{
		ID:          uuid.New(),
		Title:       "Dasar-Dasar Tahsin Al-Quran",
		Slug:        "dasar-tahsin-alquran",
		Description: "Belajar memperbaiki bacaan Al-Quran dari nol dengan metode yang mudah dipahami.",
		Thumbnail:   "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=800",
		Price:       0,
		Instructor:  "Ustadz Abdul Somad",
		Level:       "Pemula",
		Category:    "Al-Quran",
		IsPublished: true,
	}
	database.DB.Create(&freeCourse)

	// Modules for Free Course
	mod1 := models.CourseModule{ID: uuid.New(), CourseID: freeCourse.ID, Title: "Pengenalan Makharijul Huruf", SortOrder: 1}
	mod2 := models.CourseModule{ID: uuid.New(), CourseID: freeCourse.ID, Title: "Hukum Nun Sukun & Tanwin", SortOrder: 2}
	database.DB.Create(&mod1)
	database.DB.Create(&mod2)

	// Lessons for mod 1
	database.DB.Create(&models.Lesson{
		ID: uuid.New(), ModuleID: mod1.ID, Title: "Huruf Al-Jauf (Rongga Mulut)", Slug: "huruf-al-jauf",
		ContentType: "video", Content: "https://www.youtube.com/embed/dQw4w9WgXcQ", Duration: "10:00", SortOrder: 1, IsFree: true,
	})
	database.DB.Create(&models.Lesson{
		ID: uuid.New(), ModuleID: mod1.ID, Title: "Huruf Al-Halq (Tenggorokan)", Slug: "huruf-al-halq",
		ContentType: "text", Content: "<p>Makhraj Al-Halq terbagi menjadi 3 bagian: pangkal, tengah, dan ujung tenggorokan...</p>", SortOrder: 2, IsFree: true,
	})

	// 3. CREATE PAID COURSE
	paidCourse := models.Course{
		ID:          uuid.New(),
		Title:       "Fiqih Muamalah Kontemporer",
		Slug:        "fiqih-muamalah-kontemporer",
		Description: "Panduan praktis transaksi syariah di era digital, mulai dari e-wallet hingga kripto.",
		Thumbnail:   "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800",
		Price:       150000,
		Instructor:  "Dr. Erwandi Tarmizi",
		Level:       "Menengah",
		Category:    "Fiqih",
		IsPublished: true,
	}
	database.DB.Create(&paidCourse)

	// Modules for Paid Course
	pmod1 := models.CourseModule{ID: uuid.New(), CourseID: paidCourse.ID, Title: "Dasar Hukum Jual Beli", SortOrder: 1}
	pmod2 := models.CourseModule{ID: uuid.New(), CourseID: paidCourse.ID, Title: "Riba dan Transaksi Terlarang", SortOrder: 2}
	database.DB.Create(&pmod1)
	database.DB.Create(&pmod2)

	// Lessons for mod 1 (Free Preview)
	database.DB.Create(&models.Lesson{
		ID: uuid.New(), ModuleID: pmod1.ID, Title: "Rukun & Syarat Sah Jual Beli", Slug: "rukun-syarat-jual-beli",
		ContentType: "video", Content: "https://www.youtube.com/embed/9bZkp7q19f0", Duration: "15:00", SortOrder: 1, IsFree: true,
	})
	// Lessons for mod 2 (Locked/Paid)
	database.DB.Create(&models.Lesson{
		ID: uuid.New(), ModuleID: pmod2.ID, Title: "Bahaya Riba dalam Ekonomi Modern", Slug: "bahaya-riba-modern",
		ContentType: "video", Content: "https://www.youtube.com/embed/0X6vNfFf3yA", Duration: "20:00", SortOrder: 1, IsFree: false,
	})
	database.DB.Create(&models.Lesson{
		ID: uuid.New(), ModuleID: pmod2.ID, Title: "Fatwa Ulama tentang E-Wallet", Slug: "fatwa-e-wallet",
		ContentType: "text", Content: "<p>Transaksi menggunakan dompet digital diperbolehkan selama akad di dalamnya sesuai syariah...</p>", SortOrder: 2, IsFree: false,
	})

	fmt.Println("LMS Data Seeding Completed Successfully!")
}
