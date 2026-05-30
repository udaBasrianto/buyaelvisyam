package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
)

// AIChat handles standard chatbot query directly using the configured LLM API (Groq)
func AIChat(c *fiber.Ctx) error {
	var reqBody map[string]interface{}
	if err := json.Unmarshal(c.Body(), &reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format request body tidak valid."})
	}

	apiKey := os.Getenv("AI_API_KEY")
	apiBase := os.Getenv("AI_API_BASE")
	model := os.Getenv("AI_MODEL")

	// Security validation: if API key is not configured in .env, return a helpful assistant response
	if apiKey == "" {
		return c.JSON(fiber.Map{
			"choices": []fiber.Map{
				{
					"message": fiber.Map{
						"role":    "assistant",
						"content": "Assalamu'alaikum! Saya adalah asisten AI Anda. Saat ini **AI_API_KEY** belum diatur di dalam file konfigurasi `backend/.env` Anda. Silakan tambahkan variabel `AI_API_KEY` dengan kunci API yang valid agar asisten AI Anda dapat mulai berpikir secara cerdas!",
					},
				},
			},
		})
	}

	if apiBase == "" {
		apiBase = "https://api.groq.com/openai/v1"
	}
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	// Build premium Islami system context with latest 5 articles from the database (RAG)
	var systemContext strings.Builder
	systemContext.WriteString("Anda adalah 'Asisten AI', asisten pintar resmi untuk website Blog & Akademi Islami Buya Elvisyam. ")
	systemContext.WriteString("Jawablah setiap pertanyaan pengguna dengan gaya bahasa yang sangat santun, ramah, Islami (menggunakan salam seperti Assalamu'alaikum, barakallahu fiik), dan informatif.\n\n")
	systemContext.WriteString("Fokus utama Anda adalah membantu pengguna mengenai materi keagamaan, artikel blog, dan kursus akademi/LMS yang ada di website ini. ")
	systemContext.WriteString("Jika pengguna meminta Anda untuk melakukan tugas yang tidak relevan dengan website ini (seperti membuatkan aplikasi coding, menulis program/script, atau topik umum non-Islami lainnya), tolaklah dengan sangat santun dan jelaskan bahwa tugas utama Anda adalah sebagai asisten kajian keislaman dan LMS Buya Elvisyam, lalu arahkan mereka dengan ramah untuk bertanya seputar artikel atau kursus yang tersedia.\n\n")

	// Fetch latest 5 published articles from database
	var articles []models.Article
	if err := database.DB.Where("status = ?", "published").Order("created_at desc").Limit(5).Find(&articles).Error; err == nil && len(articles) > 0 {
		systemContext.WriteString("Berikut adalah data 5 artikel kajian terbaru di blog kami yang diambil secara real-time dari database:\n")
		for i, art := range articles {
			systemContext.WriteString(fmt.Sprintf("%d. **%s** (Kategori: %s)\n", i+1, art.Title, art.Category))
			if art.Excerpt != "" {
				systemContext.WriteString(fmt.Sprintf("   Kutipan: %s\n", art.Excerpt))
			}
			systemContext.WriteString(fmt.Sprintf("   Link Artikel: /artikel/%s\n\n", art.Slug))
		}
		systemContext.WriteString("Gunakan daftar artikel di atas untuk menjawab jika pengguna menanyakan artikel terbaru, cara belajar, atau topik kajian yang relevan. Selalu sertakan link artikel (/artikel/slug) agar pengguna bisa mengkliknya untuk membaca lengkap!\n")
	}

	// Prepend system context to messages array
	if msgs, ok := reqBody["messages"].([]interface{}); ok {
		systemMsg := map[string]interface{}{
			"role":    "system",
			"content": systemContext.String(),
		}
		
		// New messages list
		newMsgs := make([]interface{}, 0, len(msgs)+1)
		newMsgs = append(newMsgs, systemMsg)
		newMsgs = append(newMsgs, msgs...)
		reqBody["messages"] = newMsgs
	}

	// Forward request directly to Groq endpoint!
	url := apiBase + "/chat/completions"
	if strings.HasSuffix(apiBase, "/") {
		url = apiBase + "chat/completions"
	}

	// Create request
	agent := fiber.Post(url)
	agent.Set("Content-Type", "application/json")
	agent.Set("Authorization", "Bearer "+apiKey)

	// Inject the model identifier
	reqBody["model"] = model
	newBody, _ := json.Marshal(reqBody)
	agent.Body(newBody)
	agent.Timeout(30 * time.Second)

	status, body, errs := agent.Bytes()
	if len(errs) > 0 {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "Gagal menghubungi penyedia AI. Silakan periksa koneksi internet Anda.",
		})
	}

	c.Status(status).Set("Content-Type", "application/json")
	return c.Send(body)
}
