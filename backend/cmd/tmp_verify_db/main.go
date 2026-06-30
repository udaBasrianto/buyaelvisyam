package main

import (
	"fmt"
	"os"
	"strings"

	"backend/database"
	"backend/models"
)

func main() {
	fmt.Println("PWD", os.Getenv("PWD"))
	fmt.Println("DB_HOST", os.Getenv("DB_HOST"))
	fmt.Println("DB_PORT", os.Getenv("DB_PORT"))
	fmt.Println("DB_USER", os.Getenv("DB_USER"))
	fmt.Println("DB_NAME", os.Getenv("DB_NAME"))
	fmt.Println("JWT_SECRET", os.Getenv("JWT_SECRET") != "")
	database.ConnectDB()
	var dbName string
	database.DB.Raw("select current_database()").Scan(&dbName)
	fmt.Println("current_database", dbName)
	var profiles []models.Profile
	email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
	if err := database.DB.Where("LOWER(email) = ?", email).Find(&profiles).Error; err != nil {
		fmt.Println("FIND ERROR", err)
		return
	}
	fmt.Println("count", len(profiles))
	for i, p := range profiles {
		fmt.Printf("%d: id=%s email=%s hash=%s role=%s\n", i, p.UserID, p.Email, p.Password, p.Role)
	}
}
