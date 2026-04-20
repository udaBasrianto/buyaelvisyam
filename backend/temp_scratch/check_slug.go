package main

import (
	"fmt"
	"log"
	"backend/database"
	"backend/models"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	database.ConnectDB()

	var settings models.SiteSettings
	if err := database.DB.First(&settings).Error; err != nil {
		fmt.Printf("Error fetching settings: %v\n", err)
		return
	}

	fmt.Printf("ADMIN_SLUG: %s\n", settings.AdminSlug)
}
