package main

import (
	"fmt"
	"os"
	"strings"

	"backend/database"
	"backend/models"
)

func loadEnvFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" {
			continue
		}
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
}

func main() {
	loadEnvFile(".env")
	fmt.Println("CWD", must(os.Getwd()))
	fmt.Println("DB_HOST", os.Getenv("DB_HOST"))
	fmt.Println("DB_PORT", os.Getenv("DB_PORT"))
	fmt.Println("DB_USER", os.Getenv("DB_USER"))
	fmt.Println("DB_PASSWORD_EMPTY", os.Getenv("DB_PASSWORD") == "")
	fmt.Println("DB_NAME", os.Getenv("DB_NAME"))
	fmt.Println("JWT_SECRET_SET", os.Getenv("JWT_SECRET") != "")

	database.ConnectDB()
	var dbName string
	database.DB.Raw("select current_database()").Scan(&dbName)
	fmt.Println("current_database", dbName)

	var profile models.Profile
	email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
	if err := database.DB.Where("LOWER(email) = ?", email).First(&profile).Error; err != nil {
		fmt.Println("FIND ERR", err)
		return
	}
	fmt.Printf("EMAIL=%s HASH=%s\n", profile.Email, profile.Password)
}

func must(s string, err error) string {
	if err != nil {
		panic(err)
	}
	return s
}
