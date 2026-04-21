package main

import (
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
	"gorm.io/gorm"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect Database
	database.ConnectDB()

	// Initialize WhatsApp
	if err := handlers.InitWhatsApp(); err != nil {
		log.Println("WhatsApp initialization warning:", err)
	}

	app := fiber.New()

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
					return []byte(os.Getenv("JWT_SECRET")), nil
				})

				if token != nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						if idStr, ok := claims["id"].(string); ok {
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

				// If it's an article detail page, increment view count
				if strings.HasPrefix(p, "/artikel/") {
					slug := strings.TrimPrefix(p, "/artikel/")
					database.DB.Model(&models.Article{}).Where("slug = ? OR id::text = ?", slug, slug).UpdateColumn("views", gorm.Expr("views + 1"))
				}
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
	api.Post("/upload", handlers.UploadImage)

	// Auth
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Get("/me", middleware.Protected(), handlers.Me)
	
	// WhatsApp Auth (for pembaca registration & login)
	auth.Post("/whatsapp/request-token", handlers.RequestWhatsAppToken)
	auth.Post("/whatsapp/verify-token", handlers.VerifyWhatsAppToken)
	auth.Post("/whatsapp/login/request", handlers.RequestWhatsAppLogin)
	auth.Post("/whatsapp/login/verify", handlers.VerifyWhatsAppLogin)
	auth.Get("/whatsapp/status", handlers.GetWhatsAppStatus)
	auth.Post("/whatsapp/connect", middleware.Protected(), handlers.ConnectWhatsApp)
	auth.Post("/whatsapp/disconnect", middleware.Protected(), handlers.DisconnectWhatsApp)

	// Articles - Bulk Operations (Registered first to avoid param conflicts)
	api.Post("/articles/bulk-image-update", middleware.Protected(), handlers.BulkUpdateArticleImage)
	api.Post("/articles/bulk-delete", middleware.Protected(), handlers.BulkDeleteArticles)
	
	api.Get("/articles", handlers.GetArticles)
	api.Get("/articles/:id", handlers.GetArticle)
	api.Post("/articles", middleware.Protected(), handlers.CreateArticle)
	api.Put("/articles/:id", middleware.Protected(), handlers.UpdateArticle)
	api.Delete("/articles/:id", middleware.Protected(), handlers.DeleteArticle)

	// Categories
	api.Get("/categories", handlers.GetCategories)
	api.Post("/categories/bulk-delete", middleware.Protected(), handlers.BulkDeleteCategories)
	api.Post("/categories", middleware.Protected(), handlers.CreateCategory)
	api.Put("/categories/:id", middleware.Protected(), handlers.UpdateCategory)
	api.Delete("/categories/:id", middleware.Protected(), handlers.DeleteCategory)

	// Pages
	api.Get("/pages", handlers.GetPages)
	api.Get("/pages/:id", handlers.GetPage)
	api.Post("/pages", middleware.Protected(), handlers.CreatePage)
	api.Put("/pages/:id", middleware.Protected(), handlers.UpdatePage)
	api.Delete("/pages/:id", middleware.Protected(), handlers.DeletePage)

	// Settings
	api.Get("/settings", handlers.GetSiteSettings)

	// Blog API for Mobile/Android
	blog := api.Group("/blog")
	blog.Get("/latest", handlers.GetLatestArticles)
	blog.Get("/popular", handlers.GetPopularArticles)
	blog.Get("/search", handlers.SearchArticles)
	blog.Get("/category/:slug", handlers.GetArticlesByCategory)
	
	// Leaderboard
	api.Get("/leaderboard", handlers.GetLeaderboard)
	
	// Bookmarks
	api.Post("/bookmarks/toggle/:articleId", middleware.Protected(), handlers.ToggleBookmark)
	api.Get("/bookmarks", middleware.Protected(), handlers.GetUserBookmarks)
	api.Get("/bookmarks/check/:articleId", handlers.CheckBookmark)
	
	api.Put("/settings", middleware.Protected(), handlers.UpdateSiteSettings)

	// Features
	api.Get("/features", handlers.GetFeatures)
	api.Post("/features", middleware.Protected(), handlers.CreateFeature)
	api.Put("/features/:id", middleware.Protected(), handlers.UpdateFeature)
	api.Delete("/features/:id", middleware.Protected(), handlers.DeleteFeature)

	// Comments
	api.Get("/comments", handlers.GetComments)
	api.Post("/comments", middleware.Protected(), handlers.CreateComment)
	api.Put("/comments/:id", middleware.Protected(), handlers.UpdateComment)
	api.Delete("/comments/:id", middleware.Protected(), handlers.DeleteComment)

	// Utils
	api.Post("/upload", middleware.Protected(), handlers.UploadImage)
	api.Post("/import-wordpress", middleware.Protected(), handlers.ImportWordPress)
	api.Get("/admin/analytics", middleware.Protected(), handlers.GetAnalytics)

	// Widgets
	api.Get("/widgets", handlers.GetWidgets)
	api.Post("/widgets", middleware.Protected(), handlers.CreateWidget)
	api.Put("/widgets/:id", middleware.Protected(), handlers.UpdateWidget)
	api.Delete("/widgets/:id", middleware.Protected(), handlers.DeleteWidget)

	// Users
	api.Get("/users", middleware.Protected(), handlers.GetUsers)
	api.Put("/users/:id/role", middleware.Protected(), handlers.UpdateUserRole)
	api.Delete("/users/:id", middleware.Protected(), handlers.DeleteUser)

	// SEO
	app.Get("/sitemap.xml", handlers.GetSitemap)

	// Quizzes
	api.Get("/articles/:articleId/quiz", handlers.GetArticleQuiz)
	api.Post("/articles/:articleId/quiz", middleware.Protected(), handlers.SaveArticleQuiz)

	// LMS
	api.Get("/courses", handlers.GetCourses)
	api.Get("/courses/:slug", handlers.GetCourseBySlug)
	api.Post("/courses", middleware.Protected(), handlers.CreateCourse)
	api.Put("/courses/:id", middleware.Protected(), handlers.UpdateCourse)
	api.Delete("/courses/:id", middleware.Protected(), handlers.DeleteCourse)
	api.Get("/courses/:courseId/modules", handlers.GetModules)
	api.Post("/modules", middleware.Protected(), handlers.CreateModule)
	api.Get("/modules/:moduleId/lessons", handlers.GetLessons)
	api.Get("/courses/lesson/:slug", middleware.Protected(), handlers.GetLessonBySlug)
	api.Post("/lessons", middleware.Protected(), handlers.CreateLesson)
	
	// Enrollment
	api.Post("/courses/:id/enroll", middleware.Protected(), handlers.EnrollCourse)
	api.Get("/courses/:id/enrollment-status", middleware.Protected(), handlers.GetCheckEnrollment)
	api.Get("/admin/enrollments", middleware.Protected(), handlers.GetAllEnrollments)
	api.Put("/admin/enrollments/:id", middleware.Protected(), handlers.UpdateEnrollmentStatus)
	
	// Wallet & Transactions
	api.Get("/wallet", middleware.Protected(), handlers.GetWalletInfo)
	api.Post("/wallet/topup", middleware.Protected(), handlers.RequestTopUp)
	api.Post("/courses/:id/pay-wallet", middleware.Protected(), handlers.PayWithWallet)
	api.Get("/admin/wallet/stats", middleware.Protected(), handlers.GetAdminWalletStats)
	api.Put("/admin/wallet/approve/:id", middleware.Protected(), handlers.ApproveTopUp)
	api.Put("/admin/wallet/reject/:id", middleware.Protected(), handlers.RejectTopUp)

	// Navigation
	api.Get("/navigation", handlers.GetNavItems)
	api.Post("/navigation", middleware.Protected(), handlers.CreateNavItem)
	api.Put("/navigation/:id", middleware.Protected(), handlers.UpdateNavItem)
	api.Delete("/navigation/:id", middleware.Protected(), handlers.DeleteNavItem)
	api.Post("/navigation/reorder", middleware.Protected(), handlers.ReorderNavItems)

	// Access Logs
	api.Post("/log-attempt", handlers.LogAccessAttempt)
	api.Get("/access-logs", middleware.Protected(), handlers.GetAccessLogs)

	// Static files for images if needed
	app.Static("/uploads", "./uploads")

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	log.Fatal(app.Listen(":" + port))
}
