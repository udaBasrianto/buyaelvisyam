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

	pages := []models.Page{
		{
			ID:        uuid.New(),
			Title:     "Tentang Kami",
			Slug:      "tentang",
			Excerpt:   "Mengenal visi, misi, dan tim di balik layar platform literasi digital kami.",
			Content:   "Kami percaya bahwa ilmu adalah cahaya. Di era informasi yang begitu cepat, kami hadir untuk menjadi penyaring yang mengedukasi umat dengan sumber yang valid dan penyampaian yang modern.",
			Status:    "published",
			ShowInNav: true,
			NavOrder:  1,
		},
		{
			ID:        uuid.New(),
			Title:     "Kebijakan Privasi",
			Slug:      "privacy-policy",
			Excerpt:   "Bagaimana kami melindungi data dan privasi pengunjung kami.",
			Content:   "Keamanan data Anda adalah prioritas kami. Kami berkomitmen untuk menjaga kerahasiaan informasi personal yang Anda berikan saat berinteraksi di platform kami.",
			Status:    "published",
			ShowInNav: true,
			NavOrder:  2,
		},
		{
			ID:        uuid.New(),
			Title:     "Syarat & Ketentuan",
			Slug:      "terms",
			Excerpt:   "Peraturan penggunaan layanan dan konten di platform kami.",
			Content:   "Dengan mengakses platform ini, Anda setuju untuk mematuhi peraturan yang berlaku mengenai penggunaan konten dakwah demi kemaslahatan bersama.",
			Status:    "published",
			ShowInNav: true,
			NavOrder:  3,
		},
	}

	for _, p := range pages {
		var existing models.Page
		if err := database.DB.Where("slug = ?", p.Slug).First(&existing).Error; err != nil {
			if err := database.DB.Create(&p).Error; err != nil {
				log.Printf("Gagal insert %s: %v", p.Title, err)
			} else {
				fmt.Printf("Inserted: %s\n", p.Title)
			}
		} else {
			fmt.Printf("Skipped (exists): %s\n", p.Title)
		}
	}

	fmt.Println("\nSukses! Semua halaman standar sudah masuk ke database.")
}
