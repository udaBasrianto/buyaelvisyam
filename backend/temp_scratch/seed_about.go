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

	// Check if page already exists
	var existing models.Page
	if err := database.DB.Where("slug = ?", "tentang").First(&existing).Error; err == nil {
		fmt.Println("Halaman 'Tentang Kami' sudah ada di database.")
		return
	}

	aboutPage := models.Page{
		ID:        uuid.New(),
		Title:     "Tentang Kami",
		Slug:      "tentang",
		Excerpt:   "Platform literasi digital Islami yang berkomitmen menyajikan konten edukatif, inspiratif, dan sesuai dengan tuntunan Al-Quran dan As-Sunnah.",
		Content:   "Kami percaya bahwa ilmu adalah cahaya. Di era informasi yang begitu cepat, kami hadir untuk menjadi penyaring yang mengedukasi umat dengan sumber yang valid dan penyampaian yang modern.",
		Status:    "published",
		ShowInNav: true,
		NavOrder:  1,
	}

	if err := database.DB.Create(&aboutPage).Error; err != nil {
		log.Fatalf("Gagal seeding: %v", err)
	}

	fmt.Println("Sukses! Halaman 'Tentang Kami' sekarang sudah muncul di menu Admin.")
}
