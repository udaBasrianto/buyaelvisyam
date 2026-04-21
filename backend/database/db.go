package database

import (
	"fmt"
	"log"
	"os"

	"backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta", host, user, password, dbname, port)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connection established")

	db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

	// Auto migration (GORM will create/update tables automatically)
	// Note: We still provide database.sql for initial setup if needed
	db.AutoMigrate(
		&models.Profile{}, 
		&models.UserRole{}, 
		&models.Category{}, 
		&models.Article{}, 
		&models.Page{}, 
		&models.SiteSettings{},
		&models.FeatureItem{},
		&models.Comment{},
		&models.Visit{},
		&models.Widget{},
		&models.QuizQuestion{},
		&models.Course{},
		&models.CourseModule{},
		&models.Lesson{},
		&models.NavItem{},
		&models.AccessLog{},
		&models.Enrollment{},
		&models.Transaction{},
		&models.Bookmark{},
	)

	DB = db
}
