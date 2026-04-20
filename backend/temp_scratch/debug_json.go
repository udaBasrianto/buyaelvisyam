package main

import (
	"encoding/json"
	"fmt"
	"backend/database"
	"backend/models"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.ConnectDB()

	var settings models.SiteSettings
	database.DB.First(&settings)

	data, _ := json.MarshalIndent(settings, "", "  ")
	fmt.Println(string(data))
}
