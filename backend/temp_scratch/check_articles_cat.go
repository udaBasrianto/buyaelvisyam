package main

import (
	"fmt"
	"backend/database"
	"backend/models"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	var categories []string
	database.DB.Model(&models.Article{}).Distinct("category").Pluck("category", &categories)

	fmt.Println("Categories found in Articles table:")
	for _, cat := range categories {
		fmt.Printf("'%s'\n", cat)
	}

	var count int64
	database.DB.Model(&models.Article{}).Where("category = ?", "Al Mulakhos Al Fiqhi").Count(&count)
	fmt.Printf("\nArticles with exact 'Al Mulakhos Al Fiqhi': %d\n", count)
}
