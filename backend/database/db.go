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

	// db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)

	// Auto migration (GORM will create/update tables automatically)
	// Note: We still provide database.sql for initial setup if needed
	db.AutoMigrate(
		&models.Profile{},
		&models.UserRole{},
		&models.Category{},
		&models.Article{},
		&models.ArticleRevision{},
		&models.Page{},
		&models.SiteSettings{},
		&models.FeatureItem{},
		&models.Comment{},
		&models.UploadAsset{},
		&models.Visit{},
		&models.Widget{},
		&models.Product{},
		&models.QuizQuestion{},
		&models.Course{},
		&models.CourseModule{},
		&models.Lesson{},
		&models.LessonProgress{},
		&models.NavItem{},
		&models.AccessLog{},
		&models.Enrollment{},
		&models.Transaction{},
		&models.Bookmark{},
		&models.ReadingProgress{},
		&models.Donation{},
		&models.DonationCampaign{},
		&models.BankAccount{},
		&models.ProductOrder{},
		&models.ProductOrderItem{},
		&models.WhatsAppToken{},
		&models.WhatsAppSession{},
		&models.AdminAuditLog{},
		&models.WhatsAppBroadcastLog{},
		&models.HomepageCategorySection{},
	)

	db.Exec(`UPDATE profiles SET whats_app_number = NULL WHERE whats_app_number = ''`)
	db.Exec(`UPDATE site_settings SET checkout_web_enabled = TRUE WHERE checkout_web_enabled IS NULL`)
	db.Exec(`UPDATE site_settings SET checkout_whatsapp_enabled = TRUE WHERE checkout_whatsapp_enabled IS NULL`)
	db.Exec(`UPDATE articles SET published_at = created_at WHERE published_at IS NULL`)
	db.Exec(`UPDATE site_settings SET checkout_flat_shipping_enabled = FALSE WHERE checkout_flat_shipping_enabled IS NULL`)
	db.Exec(`UPDATE site_settings SET checkout_flat_shipping_amount = 0 WHERE checkout_flat_shipping_amount IS NULL`)
	db.Exec(`UPDATE site_settings SET checkout_flat_shipping_label = 'Ongkos Kirim' WHERE checkout_flat_shipping_label IS NULL OR checkout_flat_shipping_label = ''`)
	db.Exec(`UPDATE site_settings SET checkout_payment_due_hours = 24 WHERE checkout_payment_due_hours IS NULL OR checkout_payment_due_hours <= 0`)
	db.Exec(`ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS public_token text`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS views integer DEFAULT 0`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price double precision DEFAULT 0`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_sale boolean DEFAULT false`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_start timestamp with time zone`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_sale_end timestamp with time zone`)
	db.Exec(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[]`)
	db.Exec(`UPDATE product_orders
		SET public_token = md5(random()::text || clock_timestamp()::text || id::text) || md5(random()::text || id::text)
		WHERE public_token IS NULL OR public_token = ''`)

	DB = db
}
