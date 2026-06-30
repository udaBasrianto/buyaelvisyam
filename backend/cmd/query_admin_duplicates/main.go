package main

import (
	"fmt"
	"os"
	"strings"

	"backend/database"
	"backend/models"
)

func main() {
	if err := os.Setenv("DB_NAME", "blogs"); err != nil {
		panic(err)
	}
	if err := os.Setenv("DB_HOST", "localhost"); err != nil {
		panic(err)
	}
	if err := os.Setenv("DB_USER", "postgres"); err != nil {
		panic(err)
	}
	if err := os.Setenv("DB_PASSWORD", ""); err != nil {
		panic(err)
	}
	if err := os.Setenv("DB_PORT", "5432"); err != nil {
		panic(err)
	}
	database.ConnectDB()
	var profiles []models.Profile
	email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
	if err := database.DB.Where("LOWER(email) = ?", email).Find(&profiles).Error; err != nil {
		fmt.Println("ERROR", err)
		return
	}
	fmt.Println("COUNT:", len(profiles))
	for i, p := range profiles {
		fmt.Printf("%d: ID=%s, EMAIL=%s, HASH=%s\n", i, p.UserID, p.Email, p.Password)
	}
}
