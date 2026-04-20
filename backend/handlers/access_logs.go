package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type IpApiResponse struct {
	Status  string `json:"status"`
	Country string `json:"country"`
	City    string `json:"city"`
}

func LogAccessAttempt(c *fiber.Ctx) error {
	var body struct {
		Path   string `json:"path"`
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	ip := c.IP()
	userAgent := c.Get("User-Agent")
	location := "Unknown"

	// Fetch geolocation via IP-API (Simple & Public)
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://ip-api.com/json/" + ip)
	if err == nil {
		defer resp.Body.Close()
		var geo IpApiResponse
		if err := json.NewDecoder(resp.Body).Decode(&geo); err == nil && geo.Status == "success" {
			location = geo.City + ", " + geo.Country
		}
	}

	log := models.AccessLog{
		ID:        uuid.New(),
		IP:        ip,
		Path:      body.Path,
		UserAgent: userAgent,
		Location:  location,
		Status:    body.Status,
		CreatedAt: time.Now(),
	}

	database.DB.Create(&log)
	return c.JSON(log)
}

func GetAccessLogs(c *fiber.Ctx) error {
	var logs []models.AccessLog
	database.DB.Order("created_at desc").Limit(100).Find(&logs)
	return c.JSON(logs)
}
