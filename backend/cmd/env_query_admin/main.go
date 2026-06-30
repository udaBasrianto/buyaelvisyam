package main

import (
	"fmt"
	"os"
	"strings"

	"backend/database"
	"backend/models"
)

func main() {
	fmt.Println("cwd:", must(os.Getwd()))
	fmt.Println("DB_HOST:", os.Getenv("DB_HOST"))
	fmt.Println("DB_PORT:", os.Getenv("DB_PORT"))
	fmt.Println("DB_USER:", os.Getenv("DB_USER"))
	fmt.Println("DB_PASSWORD_EMPTY:", os.Getenv("DB_PASSWORD") == "")
	fmt.Println("DB_NAME:", os.Getenv("DB_NAME"))
	fmt.Println("JWT_SECRET_SET:", os.Getenv("JWT_SECRET") != "")

	database.ConnectDB()
	var profile models.Profile
	email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
	if err := database.DB.Where("LOWER(email) = ?", email).First(&profile).Error; err != nil {
		fmt.Println("ERR", err)
		return
	}
	fmt.Println("EMAIL", profile.Email)
	fmt.Println("HASH", profile.Password)
}

func must(s string, err error) string {
	if err != nil {
		panic(err)
	}
	return s
}
