//go:build ignore

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

	var count int64
	database.DB.Model(&models.Article{}).Count(&count)
	fmt.Printf("TOTAL_ARTICLES: %d\n", count)
}
