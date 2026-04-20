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

	var pages []models.Page
	database.DB.Find(&pages)
	for _, p := range pages {
		fmt.Printf("PAGE: title=%s, slug=%s, status=%s\n", p.Title, p.Slug, p.Status)
	}
}
