package main

import (
	"errors"
	"log"
	"os"
	"strings"
	"time"

	"backend/database"
	"backend/handlers"
	"backend/middleware"
	"backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberRecover "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func seedAdminIfRequested() {
	if !strings.EqualFold(strings.TrimSpace(os.Getenv("SEED_ADMIN")), "true") {
		return
	}

	email := strings.TrimSpace(strings.ToLower(os.Getenv("SEED_ADMIN_EMAIL")))
	password := strings.TrimSpace(os.Getenv("SEED_ADMIN_PASSWORD"))
	if email == "" || password == "" {
		log.Println("SEED_ADMIN enabled but SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD is empty")
		return
	}

	db := database.DB

	var profile models.Profile
	if err := db.Where("email = ?", email).First(&profile).Error; err == nil {
		var role models.UserRole
		if err := db.Where("user_id = ?", profile.UserID).First(&role).Error; err == nil {
			db.Model(&role).Update("role", "admin")
		} else {
			db.Create(&models.UserRole{UserID: profile.UserID, Role: "admin"})
		}
		log.Println("Seed admin: user exists, role ensured admin:", email)
		return
	}

	hashed, err := handlers.HashPassword(password)
	if err != nil {
		log.Println("Seed admin: failed to hash password:", err)
		return
	}

	userID := uuid.New()
	profile = models.Profile{
		UserID:      userID,
		Email:       email,
		Password:    hashed,
		DisplayName: "Admin",
	}

	if err := db.Create(&profile).Error; err != nil {
		log.Println("Seed admin: failed to create profile:", err)
		return
	}
	db.Create(&models.UserRole{UserID: userID, Role: "admin"})
	log.Println("Seed admin: created admin user:", email)
}

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	// Connect Database
	database.ConnectDB()
	registerSitemapHooks(database.DB)

	seedAdminIfRequested()

	// Initialize WhatsApp
	if err := handlers.InitWhatsApp(); err != nil {
		log.Println("WhatsApp initialization warning:", err)
	}

	go func() {
		t := time.NewTicker(30 * time.Second)
		defer t.Stop()
		for range t.C {
			now := time.Now()
			var due []models.Article
			database.DB.
				Where("status = ? AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= ?", "review", now).
				Find(&due)
			for _, a := range due {
				if a.ScheduledPublishAt == nil {
					continue
				}
				res := database.DB.Model(&models.Article{}).
					Where("id = ? AND status = ?", a.ID, "review").
					Updates(map[string]any{
						"status":               "published",
						"scheduled_publish_at": nil,
						"created_at":           *a.ScheduledPublishAt,
					})
				if res.Error == nil && res.RowsAffected > 0 {
					article := a
					article.Status = "published"
					go func(art models.Article) {
						defer func() { recover() }()
						handlers.NotifyWhatsAppNewArticle(art)
					}(article)
				}
			}
		}
	}()

	app := fiber.New(fiber.Config{
		ProxyHeader: "X-Forwarded-For",
		BodyLimit:   10 * 1024 * 1024,
	})

	// Recover middleware — prevents panics from killing the server
	app.Use(fiberRecover.New())

	// Visitor Tracking Middleware
	app.Use(func(c *fiber.Ctx) error {
		path := c.Path()
		// Only track public page views, ignore api, static, and admin
		if !strings.HasPrefix(path, "/api") && !strings.HasPrefix(path, "/uploads") && !strings.Contains(path, ".") {
			var userID *uuid.UUID
			isAdmin := false

			// Try to get user ID from JWT if present
			authHeader := c.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString := strings.TrimPrefix(authHeader, "Bearer ")
				token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
					if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
						return nil, errors.New("unexpected signing method")
					}
					return []byte(jwtSecret), nil
				})

				if token != nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						if idStr, ok := claims["user_id"].(string); ok {
							if uid, err := uuid.Parse(idStr); err == nil {
								userID = &uid
							}
						}
						if roleVal, ok := claims["role"].(string); ok && roleVal == "admin" {
							isAdmin = true
						}
					}
				}
			}

			// Do not track if user is admin, or accessing admin/auth paths
			isAuthOrAdminPath := strings.HasPrefix(path, "/admin") || 
				strings.HasPrefix(path, "/yaakhi") || 
				strings.HasPrefix(path, "/wp-admin") || 
				strings.HasPrefix(path, "/auth") || 
				strings.HasPrefix(path, "/login")

			if !isAdmin && !isAuthOrAdminPath {
				// Run DB writes in separate goroutine so they never block / crash handler
				go func(p string, uid *uuid.UUID, ip, ua string) {
					defer func() { recover() }()
					visit := models.Visit{
						ID:        uuid.New(),
						UserID:    uid,
						IP:        ip,
						Path:      p,
						UserAgent: ua,
						CreatedAt: time.Now(),
					}
					database.DB.Create(&visit)
				}(path, userID, c.IP(), c.Get("User-Agent"))
			}
		}
		return c.Next()
	})

	// Middleware
	app.Use(logger.New())
	app.Static("/uploads", "./uploads")

	// Configure CORS with specific allowed origins
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:8080, http://localhost:5173" // dev defaults
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Idempotency-Key",
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	api := app.Group("/api")
	api.Get("/ping", func(c *fiber.Ctx) error { return c.SendString("pong") })
	api.Get("/health", handlers.Health)
	api.Get("/stats", handlers.GetPublicStats)

	// Auth
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	authLimiter := limiter.New(limiter.Config{Max: 25, Expiration: 15 * time.Minute})
	otpLimiter := limiter.New(limiter.Config{Max: 15, Expiration: 15 * time.Minute})
	auth.Post("/login", authLimiter, handlers.Login)
	auth.Post("/google", authLimiter, handlers.GoogleLogin)
	auth.Get("/me", middleware.Protected(), handlers.Me)
	auth.Put("/profile", middleware.Protected(), handlers.UpdateProfile)
	auth.Post("/profile", middleware.Protected(), handlers.UpdateProfile)

	// WhatsApp Auth (for pembaca registration & login)
	auth.Post("/whatsapp/request-token", otpLimiter, handlers.RequestWhatsAppToken)
	auth.Post("/whatsapp/verify-token", otpLimiter, handlers.VerifyWhatsAppToken)
	auth.Post("/whatsapp/login/request", otpLimiter, handlers.RequestWhatsAppLogin)
	auth.Post("/whatsapp/login/verify", otpLimiter, handlers.VerifyWhatsAppLogin)
	auth.Get("/whatsapp/status", handlers.GetWhatsAppStatus)
	auth.Post("/whatsapp/connect", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.ConnectWhatsApp)
	auth.Post("/whatsapp/disconnect", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.DisconnectWhatsApp)
	adminWhatsAppLimiter := limiter.New(limiter.Config{Max: 2, Expiration: 10 * time.Minute})
	api.Post("/admin/whatsapp/broadcast", middleware.Protected(), middleware.RequireAnyRole("admin"), adminWhatsAppLimiter, middleware.AuditAdminActions(), handlers.AdminBroadcastWhatsApp)

	// Articles - Bulk Operations (Registered first to avoid param conflicts)
	api.Post("/articles/bulk-image-update", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.BulkUpdateArticleImage)
	api.Post("/articles/bulk-delete", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.BulkDeleteArticles)

	api.Get("/articles", handlers.GetArticles)
	api.Get("/articles/:id/related", handlers.GetRelatedArticles)
	api.Get("/articles/:id", handlers.GetArticle)
	api.Post("/articles", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.CreateArticle)
	api.Put("/articles/:id", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.UpdateArticle)
	api.Get("/articles/:id/revisions", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.GetArticleRevisions)
	api.Post("/articles/:id/revisions/:revId/restore", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.RestoreArticleRevision)
	api.Delete("/articles/:id", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), middleware.AuditAdminActions(), handlers.DeleteArticle)

	// Public Export API (for importing to other websites)
	export := api.Group("/export/v1")
	export.Get("/articles", handlers.ExportArticles)
	export.Get("/articles/:id", handlers.ExportArticle)

	// Categories
	api.Get("/categories", handlers.GetCategories)
	api.Post("/categories/bulk-delete", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.BulkDeleteCategories)
	api.Post("/categories", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateCategory)
	api.Put("/categories/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateCategory)
	api.Delete("/categories/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteCategory)

	api.Get("/products", handlers.GetProducts)
	api.Get("/products/:slug", handlers.GetProduct)
	orderLimiter := limiter.New(limiter.Config{Max: 10, Expiration: 15 * time.Minute})
	api.Post("/orders", orderLimiter, handlers.CreateOrder)
	api.Get("/orders/public/:token", handlers.GetPublicOrderByToken)
	api.Get("/admin/products", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetProducts)
	api.Post("/admin/products", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.CreateProduct)
	api.Put("/admin/products/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.UpdateProduct)
	api.Delete("/admin/products/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.DeleteProduct)
	api.Get("/admin/orders", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminGetOrders)
	api.Put("/admin/orders/:id/status", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateOrderStatus)

	// Pages
	api.Get("/pages", handlers.GetPages)
	api.Get("/pages/:id", handlers.GetPage)
	api.Post("/pages", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreatePage)
	api.Put("/pages/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdatePage)
	api.Delete("/pages/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeletePage)

	// Settings
	api.Get("/settings", handlers.GetSiteSettings)

	// Donations
	api.Get("/donations/settings", handlers.GetDonationSettings)
	api.Get("/donations/campaigns", handlers.GetPublicDonationCampaigns)
	api.Get("/donations", handlers.GetPublicDonations)
	api.Post("/donations", handlers.CreateDonation)
	api.Get("/user/donations", middleware.Protected(), handlers.UserGetDonations)

	// Blog API for Mobile/Android
	blog := api.Group("/blog")
	blog.Get("/latest", handlers.GetLatestArticles)
	blog.Get("/popular", handlers.GetPopularArticles)
	blog.Get("/search", handlers.SearchArticles)
	blog.Get("/category/:slug", handlers.GetArticlesByCategory)

	// Leaderboard
	api.Get("/leaderboard", handlers.GetLeaderboard)

	// Bookmarks
	api.Post("/koleksi/toggle/:articleId", middleware.Protected(), handlers.ToggleBookmark)
	api.Get("/koleksi", middleware.Protected(), handlers.GetUserBookmarks)
	api.Get("/koleksi/check/:articleId", handlers.CheckBookmark)
	api.Post("/reading-progress", middleware.Protected(), handlers.UpsertReadingProgress)
	api.Get("/reading-progress/continue", middleware.Protected(), handlers.GetContinueReading)

	api.Put("/settings", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.UpdateSiteSettings)

	// Features
	api.Get("/features", handlers.GetFeatures)
	api.Post("/features", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateFeature)
	api.Put("/features/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateFeature)
	api.Delete("/features/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteFeature)

	// Comments
	api.Get("/comments", handlers.GetComments)
	commentLimiter := limiter.New(limiter.Config{Max: 8, Expiration: 1 * time.Minute})
	api.Post("/comments", middleware.Protected(), commentLimiter, handlers.CreateComment)
	api.Put("/comments/:id", middleware.Protected(), handlers.UpdateComment)
	api.Delete("/comments/:id", middleware.Protected(), handlers.DeleteComment)
	api.Put("/comments/:id/status", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateCommentStatus)

	// Utils
	api.Post("/upload", middleware.Protected(), handlers.UploadImage)
	api.Get("/admin/assets", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.AdminListUploadAssets)
	api.Post("/import-wordpress", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ImportWordPress)
	api.Post("/import-export", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ImportExportV1)
	api.Post("/analytics/track", handlers.TrackVisit)
	api.Get("/admin/analytics", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.GetAnalytics)
	api.Get("/admin/notifications/count", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetAdminNotificationCounts)
	api.Get("/admin/donations", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminGetDonations)
	api.Put("/admin/donations/settings", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateDonationSettings)
	api.Put("/admin/donations/:id/status", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateDonationStatus)
	api.Delete("/admin/donations/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminDeleteDonation)
	api.Get("/admin/bank-accounts", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminGetBankAccounts)
	api.Post("/admin/bank-accounts", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminCreateBankAccount)
	api.Put("/admin/bank-accounts/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateBankAccount)
	api.Delete("/admin/bank-accounts/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminDeleteBankAccount)
	api.Get("/admin/donation-campaigns", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminGetDonationCampaigns)
	api.Post("/admin/donation-campaigns", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminCreateDonationCampaign)
	api.Put("/admin/donation-campaigns/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminUpdateDonationCampaign)
	api.Delete("/admin/donation-campaigns/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.AdminDeleteDonationCampaign)

	// Widgets
	api.Get("/widgets", handlers.GetWidgets)
	api.Post("/widgets", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateWidget)
	api.Put("/widgets/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateWidget)
	api.Delete("/widgets/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteWidget)

	// Users
	api.Get("/users", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.GetUsers)
	api.Post("/users", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.CreateUser)
	api.Put("/users/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.UpdateUser)
	api.Put("/users/:id/role", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.UpdateUserRole)
	api.Delete("/users/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), middleware.AuditAdminActions(), handlers.DeleteUser)

	// SEO
	app.Get("/sitemap.xml", handlers.GetSitemap)

	// Quizzes
	api.Get("/articles/:articleId/quiz", handlers.GetArticleQuiz)
	api.Post("/articles/:articleId/quiz", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.SaveArticleQuiz)

	// LMS
	api.Get("/courses", handlers.GetCourses)
	api.Get("/courses/:slug", handlers.GetCourseBySlug)
	api.Post("/courses", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateCourse)
	api.Put("/courses/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateCourse)
	api.Delete("/courses/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteCourse)
	api.Get("/courses/:courseId/modules", handlers.GetModules)
	api.Post("/modules", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateModule)
	api.Get("/modules/:moduleId/lessons", handlers.GetLessons)
	api.Get("/courses/lesson/:slug", middleware.Protected(), handlers.GetLessonBySlug)
	api.Get("/courses/:id/progress", middleware.Protected(), handlers.GetMyCourseProgress)
	api.Post("/lessons/:lessonId/complete", middleware.Protected(), handlers.MarkLessonComplete)
	api.Delete("/lessons/:lessonId/complete", middleware.Protected(), handlers.UnmarkLessonComplete)
	api.Post("/lessons", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateLesson)

	// Enrollment
	api.Post("/courses/:id/enroll", middleware.Protected(), handlers.EnrollCourse)
	api.Get("/courses/:id/enrollment-status", middleware.Protected(), handlers.GetCheckEnrollment)
	api.Get("/admin/enrollments", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetAllEnrollments)
	api.Put("/admin/enrollments/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateEnrollmentStatus)

	// Wallet & Transactions
	api.Get("/wallet", middleware.Protected(), handlers.GetWalletInfo)
	api.Post("/wallet/topup", middleware.Protected(), handlers.RequestTopUp)
	api.Post("/courses/:id/pay-wallet", middleware.Protected(), handlers.PayWithWallet)
	api.Get("/admin/wallet/stats", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetAdminWalletStats)
	api.Put("/admin/wallet/approve/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ApproveTopUp)
	api.Put("/admin/wallet/reject/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.RejectTopUp)

	// Navigation
	api.Get("/navigation", handlers.GetNavItems)
	api.Post("/navigation", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateNavItem)
	api.Put("/navigation/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateNavItem)
	api.Delete("/navigation/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteNavItem)
	api.Post("/navigation/reorder", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ReorderNavItems)

	// Bookmark alias for frontend compatibility
	api.Get("/bookmarks/check/:articleId", handlers.CheckBookmark)

	// Access Logs
	api.Post("/log-attempt", handlers.LogAccessAttempt)
	api.Get("/access-logs", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetAccessLogs)

	// AI Chatbot Route
	log.Println("Registering AI Chat route...")
	api.Post("/ai/chat", handlers.AIChat)

	// Serve homepage dynamically for SEO tags injection
	app.Get("/", handlers.ServeDynamicSEO)

	// Serve sitemap dynamically to automatically detect host domain
	app.Get("/sitemap.xml", handlers.GetSitemap)

	// Serve frontend static assets in production (Vite built files)
	app.Static("/", "../dist")

	// Dynamic SEO routes for sharing articles
	app.Get("/artikel/:slug", handlers.ServeDynamicSEO)
	app.Get("/produk/:slug", handlers.ServeDynamicSEO)
	app.Get("/kategori/:slug", handlers.ServeDynamicSEO)
	app.Get("/p/:slug", handlers.ServeDynamicSEO)
	app.Get("/:slug", handlers.ServeDynamicSEO)

	// SPA Wildcard fallback
	app.Get("*", handlers.ServeDynamicSEO)

	// Generate sitemap on startup
	handlers.GenerateSitemapFile()

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Fatal(app.Listen(":" + port))
}

func registerSitemapHooks(db *gorm.DB) {
	cb := func(d *gorm.DB) {
		if d.Error != nil {
			return
		}
		var tableName string
		if d.Statement != nil {
			if d.Statement.Table != "" {
				tableName = d.Statement.Table
			} else if d.Statement.Schema != nil {
				tableName = d.Statement.Schema.Table
			}
		}
		if tableName == "articles" || tableName == "pages" || tableName == "categories" || tableName == "courses" || tableName == "lessons" {
			go handlers.GenerateSitemapFile()
		}
	}

	db.Callback().Create().After("gorm:create").Register("sitemap:create", cb)
	db.Callback().Update().After("gorm:update").Register("sitemap:update", cb)
	db.Callback().Delete().After("gorm:delete").Register("sitemap:delete", cb)
}
