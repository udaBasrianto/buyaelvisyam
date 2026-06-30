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
	var profile models.Profile
	email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
	if err := database.DB.Where("LOWER(email) = ?", email).First(&profile).Error; err != nil {
		fmt.Println("ERROR", err)
		return
	}
	fmt.Println("EMAIL:", profile.Email)
	fmt.Println("HASH:", profile.Password)
}
