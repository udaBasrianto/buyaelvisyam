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
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberRecover "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
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

	seedAdminIfRequested()

	// Initialize WhatsApp
	if err := handlers.InitWhatsApp(); err != nil {
		log.Println("WhatsApp initialization warning:", err)
	}

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
					}
				}
			}

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
		return c.Next()
	})

	// Middleware
	app.Use(logger.New())
	app.Static("/uploads", "./uploads")
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Routes
	api := app.Group("/api")
	api.Get("/ping", func(c *fiber.Ctx) error { return c.SendString("pong") })
	api.Get("/stats", handlers.GetPublicStats)

	// Auth
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/me", middleware.Protected(), handlers.Me)
	auth.Put("/profile", middleware.Protected(), handlers.UpdateProfile)
	auth.Post("/profile", middleware.Protected(), handlers.UpdateProfile)
	
	// WhatsApp Auth (for pembaca registration & login)
	auth.Post("/whatsapp/request-token", handlers.RequestWhatsAppToken)
	auth.Post("/whatsapp/verify-token", handlers.VerifyWhatsAppToken)
	auth.Post("/whatsapp/login/request", handlers.RequestWhatsAppLogin)
	auth.Post("/whatsapp/login/verify", handlers.VerifyWhatsAppLogin)
	auth.Get("/whatsapp/status", handlers.GetWhatsAppStatus)
	auth.Post("/whatsapp/connect", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ConnectWhatsApp)
	auth.Post("/whatsapp/disconnect", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DisconnectWhatsApp)

	// Articles - Bulk Operations (Registered first to avoid param conflicts)
	api.Post("/articles/bulk-image-update", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.BulkUpdateArticleImage)
	api.Post("/articles/bulk-delete", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.BulkDeleteArticles)
	
	api.Get("/articles", handlers.GetArticles)
	api.Get("/articles/:id", handlers.GetArticle)
	api.Post("/articles", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.CreateArticle)
	api.Put("/articles/:id", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.UpdateArticle)
	api.Delete("/articles/:id", middleware.Protected(), middleware.RequireAnyRole("admin", "kontributor"), handlers.DeleteArticle)

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
	api.Get("/donations", handlers.GetPublicDonations)
	api.Post("/donations", handlers.CreateDonation)

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
	
	api.Put("/settings", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateSiteSettings)

	// Features
	api.Get("/features", handlers.GetFeatures)
	api.Post("/features", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateFeature)
	api.Put("/features/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateFeature)
	api.Delete("/features/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteFeature)

	// Comments
	api.Get("/comments", handlers.GetComments)
	api.Post("/comments", middleware.Protected(), handlers.CreateComment)
	api.Put("/comments/:id", middleware.Protected(), handlers.UpdateComment)
	api.Delete("/comments/:id", middleware.Protected(), handlers.DeleteComment)

	// Utils
	api.Post("/upload", middleware.Protected(), handlers.UploadImage)
	api.Post("/import-wordpress", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ImportWordPress)
	api.Post("/import-export", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.ImportExportV1)
	api.Post("/analytics/track", handlers.TrackVisit)
	api.Get("/admin/analytics", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetAnalytics)
	api.Get("/admin/donations", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminGetDonations)
	api.Put("/admin/donations/settings", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminUpdateDonationSettings)
	api.Put("/admin/donations/:id/status", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminUpdateDonationStatus)
	api.Delete("/admin/donations/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminDeleteDonation)
	api.Get("/admin/bank-accounts", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminGetBankAccounts)
	api.Post("/admin/bank-accounts", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminCreateBankAccount)
	api.Put("/admin/bank-accounts/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminUpdateBankAccount)
	api.Delete("/admin/bank-accounts/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.AdminDeleteBankAccount)

	// Widgets
	api.Get("/widgets", handlers.GetWidgets)
	api.Post("/widgets", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateWidget)
	api.Put("/widgets/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateWidget)
	api.Delete("/widgets/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteWidget)

	// Users
	api.Get("/users", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.GetUsers)
	api.Post("/users", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.CreateUser)
	api.Put("/users/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateUser)
	api.Put("/users/:id/role", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.UpdateUserRole)
	api.Delete("/users/:id", middleware.Protected(), middleware.RequireAnyRole("admin"), handlers.DeleteUser)

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

	// Serve frontend static assets in production (Vite built files)
	app.Static("/", "../dist")

	// Dynamic SEO routes for sharing articles
	app.Get("/artikel/:slug", handlers.ServeDynamicSEO)
	app.Get("/:slug", handlers.ServeDynamicSEO)

	// SPA Wildcard fallback
	app.Get("*", handlers.ServeDynamicSEO)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Fatal(app.Listen(":" + port))
}
