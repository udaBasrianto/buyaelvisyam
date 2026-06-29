package handlers

import (
	"backend/database"
	"backend/models"
	"backend/service"
	"errors"
	"math"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func getOptionalUserID(c *fiber.Ctx) *uuid.UUID {
	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil
	}
	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if tokenString == "" {
		return nil
	}

	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret == "" {
		return nil
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Token tidak valid")
		}
		return []byte(jwtSecret), nil
	})
	if err != nil || token == nil || !token.Valid {
		return nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil
	}
	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return nil
	}
	uid, err := uuid.Parse(strings.TrimSpace(userIDStr))
	if err != nil {
		return nil
	}
	return &uid
}

func normalizeImageURL(s string) (string, error) {
	val := strings.TrimSpace(s)
	if val == "" {
		return "", nil
	}
	lower := strings.ToLower(val)
	if strings.HasPrefix(lower, "javascript:") || strings.HasPrefix(lower, "data:") {
		return "", errors.New("invalid image url")
	}
	if strings.HasPrefix(val, "/uploads/") || strings.HasPrefix(val, "http://") || strings.HasPrefix(val, "https://") {
		return val, nil
	}
	return "", errors.New("invalid image url")
}

func GetDonationSettings(c *fiber.Ctx) error {
	db := database.DB

	var settings models.SiteSettings
	db.First(&settings)

	var accounts []models.BankAccount
	db.Where("is_active = ?", true).Order("sort_order asc, created_at desc").Find(&accounts)

	return c.JSON(fiber.Map{
		"site_name":             settings.SiteName,
		"donation_title":        settings.DonationTitle,
		"donation_description":  settings.DonationDescription,
		"donation_instructions": settings.DonationInstructions,
		"show_donors":           settings.ShowDonors,
		"bank_accounts":         accounts,
	})
}

func CreateDonation(c *fiber.Ctx) error {
	type Input struct {
		Amount              int64  `json:"amount"`
		DonorName           string `json:"donor_name"`
		IsAnonymous         bool   `json:"is_anonymous"`
		WhatsAppNumber      string `json:"whatsapp_number"`
		Message             string `json:"message"`
		ProofURL            string `json:"proof_url"`
		TransferDate        string `json:"transfer_date"`
		BankAccountID       string `json:"bank_account_id"`
		CampaignID          string `json:"campaign_id"`
		SenderName          string `json:"sender_name"`
		SenderBank          string `json:"sender_bank"`
		SenderAccountNumber string `json:"sender_account_number"`
	}

	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	input.DonorName = strings.TrimSpace(input.DonorName)
	input.WhatsAppNumber = strings.TrimSpace(input.WhatsAppNumber)
	input.Message = strings.TrimSpace(input.Message)
	input.ProofURL = strings.TrimSpace(input.ProofURL)
	input.TransferDate = strings.TrimSpace(input.TransferDate)
	input.BankAccountID = strings.TrimSpace(input.BankAccountID)
	input.CampaignID = strings.TrimSpace(input.CampaignID)
	input.SenderName = strings.TrimSpace(input.SenderName)
	input.SenderBank = strings.TrimSpace(input.SenderBank)
	input.SenderAccountNumber = strings.TrimSpace(input.SenderAccountNumber)

	if input.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Nominal donasi tidak valid"})
	}

	if input.BankAccountID != "" {
		if _, err := uuid.Parse(input.BankAccountID); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Rekening tujuan tidak valid"})
		}
	}

	if input.CampaignID != "" {
		if _, err := uuid.Parse(input.CampaignID); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Program donasi tidak valid"})
		}
	}

	if input.TransferDate != "" {
		if _, err := time.Parse(time.RFC3339, input.TransferDate); err != nil {
			if _, err2 := time.Parse("2006-01-02", input.TransferDate); err2 != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Tanggal transfer tidak valid"})
			}
		}
	}

	var bankAccountID *uuid.UUID
	if input.BankAccountID != "" {
		parsed := uuid.MustParse(input.BankAccountID)
		bankAccountID = &parsed
	}

	var campaignID *uuid.UUID
	if input.CampaignID != "" {
		parsed := uuid.MustParse(input.CampaignID)
		campaignID = &parsed
	}

	var transferAt *time.Time
	if input.TransferDate != "" {
		var t time.Time
		if parsed, err := time.Parse(time.RFC3339, input.TransferDate); err == nil {
			t = parsed
		} else if parsed, err := time.Parse("2006-01-02", input.TransferDate); err == nil {
			t = parsed
		}
		transferAt = &t
	}

	userID := getOptionalUserID(c)

	var donationWhatsApp *string
	if input.WhatsAppNumber != "" {
		normalized, err := normalizeWhatsAppNumber(input.WhatsAppNumber)
		if err != nil {
			if ferr, ok := err.(*fiber.Error); ok {
				return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
			}
			return c.Status(400).JSON(fiber.Map{"error": "Nomor WhatsApp tidak valid"})
		}
		donationWhatsApp = &normalized
	}

	donation := models.Donation{
		ID:                  uuid.New(),
		UserID:              userID,
		BankAccountID:       bankAccountID,
		CampaignID:          campaignID,
		Amount:              input.Amount,
		Currency:            "IDR",
		DonorName:           input.DonorName,
		IsAnonymous:         input.IsAnonymous,
		WhatsAppNumber:      donationWhatsApp,
		Message:             input.Message,
		ProofURL:            input.ProofURL,
		SenderName:          input.SenderName,
		SenderBank:          input.SenderBank,
		SenderAccountNumber: input.SenderAccountNumber,
		TransferDate:        transferAt,
		Status:              "pending",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if err := database.DB.Create(&donation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan donasi"})
	}

	return c.JSON(fiber.Map{
		"message": "Donasi berhasil dikirim dan menunggu verifikasi admin",
		"id":      donation.ID,
		"status":  donation.Status,
	})
}

func GetPublicDonations(c *fiber.Ctx) error {
	db := database.DB

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	var settings models.SiteSettings
	db.First(&settings)
	if !settings.ShowDonors {
		return c.JSON([]fiber.Map{})
	}

	var donations []models.Donation
	db.Where("status = ?", "approved").Order("created_at desc").Limit(limit).Find(&donations)

	out := make([]fiber.Map, 0, len(donations))
	for _, d := range donations {
		name := strings.TrimSpace(d.DonorName)
		if d.IsAnonymous || name == "" {
			name = "Anonim"
		}
		out = append(out, fiber.Map{
			"id":         d.ID,
			"donor_name": name,
			"message":    d.Message,
			"amount":     d.Amount,
			"currency":   d.Currency,
			"created_at": d.CreatedAt,
		})
	}

	return c.JSON(out)
}

func GetPublicDonationCampaigns(c *fiber.Ctx) error {
	db := database.DB

	var campaigns []models.DonationCampaign
	db.Where("is_active = ?", true).
		Order("sort_order asc, created_at desc").
		Find(&campaigns)

	type RaisedRow struct {
		CampaignID uuid.UUID
		Raised     int64
	}
	var raisedRows []RaisedRow
	db.Table("donations").
		Select("campaign_id, COALESCE(sum(amount), 0) as raised").
		Where("status = ? AND campaign_id IS NOT NULL", "approved").
		Group("campaign_id").
		Scan(&raisedRows)

	raisedByCampaignID := make(map[uuid.UUID]int64, len(raisedRows))
	for _, r := range raisedRows {
		raisedByCampaignID[r.CampaignID] = r.Raised
	}

	out := make([]fiber.Map, 0, len(campaigns))
	for _, cpn := range campaigns {
		raised := raisedByCampaignID[cpn.ID]
		progress := 0.0
		if cpn.TargetAmount > 0 {
			progress = (float64(raised) / float64(cpn.TargetAmount)) * 100.0
			if math.IsNaN(progress) || math.IsInf(progress, 0) {
				progress = 0
			}
			progress = math.Max(0, math.Min(100, progress))
		}
		out = append(out, fiber.Map{
			"id":               cpn.ID,
			"title":            cpn.Title,
			"description":      cpn.Description,
			"image_url":        cpn.ImageURL,
			"target_amount":    cpn.TargetAmount,
			"raised_amount":    raised,
			"currency":         cpn.Currency,
			"progress_percent": progress,
			"is_active":        cpn.IsActive,
			"sort_order":       cpn.SortOrder,
			"start_at":         cpn.StartAt,
			"end_at":           cpn.EndAt,
			"created_at":       cpn.CreatedAt,
			"updated_at":       cpn.UpdatedAt,
		})
	}

	return c.JSON(out)
}

func AdminGetDonations(c *fiber.Ctx) error {
	db := database.DB

	status := strings.TrimSpace(strings.ToLower(c.Query("status", "")))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := (page - 1) * limit

	query := db.Model(&models.Donation{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	type DonationRow struct {
		models.Donation
		UserEmail       *string `json:"user_email"`
		UserDisplayName *string `json:"user_display_name"`
		BankName        *string `json:"bank_name"`
		AccountNumber   *string `json:"account_number"`
		AccountHolder   *string `json:"account_holder"`
		CampaignTitle   *string `json:"campaign_title"`
	}

	var rows []DonationRow
	query.Table("donations").
		Select("donations.*, profiles.email as user_email, profiles.display_name as user_display_name, bank_accounts.bank_name, bank_accounts.account_number, bank_accounts.account_holder, donation_campaigns.title as campaign_title").
		Joins("left join profiles on profiles.user_id = donations.user_id").
		Joins("left join bank_accounts on bank_accounts.id = donations.bank_account_id").
		Joins("left join donation_campaigns on donation_campaigns.id = donations.campaign_id").
		Order("donations.created_at desc").
		Limit(limit).
		Offset(offset).
		Scan(&rows)

	return c.JSON(fiber.Map{
		"data":  rows,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func AdminUpdateDonationSettings(c *fiber.Ctx) error {
	type Input struct {
		DonationTitle        *string `json:"donation_title"`
		DonationDescription  *string `json:"donation_description"`
		DonationInstructions *string `json:"donation_instructions"`
		ShowDonors           *bool   `json:"show_donors"`
	}

	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	updates := map[string]any{}
	if input.DonationTitle != nil {
		updates["donation_title"] = strings.TrimSpace(*input.DonationTitle)
	}
	if input.DonationDescription != nil {
		updates["donation_description"] = strings.TrimSpace(*input.DonationDescription)
	}
	if input.DonationInstructions != nil {
		updates["donation_instructions"] = strings.TrimSpace(*input.DonationInstructions)
	}
	if input.ShowDonors != nil {
		updates["show_donors"] = *input.ShowDonors
	}

	if len(updates) == 0 {
		return c.JSON(fiber.Map{"message": "Tidak ada perubahan"})
	}

	updates["updated_at"] = time.Now()

	db := database.DB
	var settings models.SiteSettings
	if err := db.First(&settings).Error; err != nil {
		settings = models.SiteSettings{
			ID: uuid.New(),
		}
		db.Create(&settings)
	}

	if err := db.Model(&settings).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan pengaturan donasi"})
	}

	return c.JSON(fiber.Map{"message": "Pengaturan donasi disimpan"})
}

func AdminUpdateDonationStatus(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	donationID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID donasi tidak valid"})
	}

	type Input struct {
		Status    string `json:"status"`
		AdminNote string `json:"admin_note"`
	}
	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	status := strings.TrimSpace(strings.ToLower(input.Status))
	if status != "pending" && status != "approved" && status != "rejected" {
		return c.Status(400).JSON(fiber.Map{"error": "Status tidak valid"})
	}

	adminNote := strings.TrimSpace(input.AdminNote)

	var donation models.Donation
	if err := database.DB.Where("id = ?", donationID).First(&donation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Donasi tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat donasi"})
	}

	previousStatus := donation.Status
	donation.Status = status
	donation.AdminNote = adminNote
	donation.UpdatedAt = time.Now()

	if err := database.DB.Save(&donation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui status donasi"})
	}

	if previousStatus != "approved" && status == "approved" {
		if strings.EqualFold(strings.TrimSpace(os.Getenv("WHATSAPP_ENABLED")), "true") {
			number := ""
			if donation.WhatsAppNumber != nil && strings.TrimSpace(*donation.WhatsAppNumber) != "" {
				number = strings.TrimSpace(*donation.WhatsAppNumber)
			} else if donation.UserID != nil {
				var profile models.Profile
				if err := database.DB.Where("user_id = ?", *donation.UserID).First(&profile).Error; err == nil {
					if profile.WhatsAppNumber != nil && strings.TrimSpace(*profile.WhatsAppNumber) != "" {
						number = strings.TrimSpace(*profile.WhatsAppNumber)
					}
				}
			}

			if number != "" {
				name := strings.TrimSpace(donation.DonorName)
				if name == "" && donation.UserID != nil {
					var profile models.Profile
					if err := database.DB.Where("user_id = ?", *donation.UserID).First(&profile).Error; err == nil {
						name = strings.TrimSpace(profile.DisplayName)
					}
				}
				if name == "" {
					name = "akhi"
				}
				message := "Jazakumullahu khoiron atas donasi antum, donasi kami gunakan utk maintenance website ini gar terus dapat menebar ilmu yg bermanfaat. barokallahu fiikum wa ahlikum akhi " + name
				go func(phone, msg string) {
					defer func() { recover() }()
					ws := service.GetWhatsAppService()
					_ = ws.SendMessage(phone, msg)
				}(number, message)
			}
		}
	}

	return c.JSON(fiber.Map{"message": "Status donasi diperbarui"})
}

func AdminDeleteDonation(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	donationID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID donasi tidak valid"})
	}

	if err := database.DB.Where("id = ?", donationID).Delete(&models.Donation{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus donasi"})
	}

	return c.JSON(fiber.Map{"message": "Donasi dihapus"})
}

func UserGetDonations(c *fiber.Ctx) error {
	db := database.DB

	// Get user ID from JWT
	user := c.Locals("user")
	token, ok := user.(*jwt.Token)
	if !ok || token == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	status := strings.TrimSpace(strings.ToLower(c.Query("status", "")))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	query := db.Where("user_id = ?", userID)
	if status != "" && (status == "pending" || status == "approved" || status == "rejected") {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Model(&models.Donation{}).Count(&total)

	type DonationRow struct {
		models.Donation
		BankName      *string `json:"bank_name"`
		AccountNumber *string `json:"account_number"`
		CampaignTitle *string `json:"campaign_title"`
	}

	var rows []DonationRow
	query.Table("donations").
		Select("donations.*, bank_accounts.bank_name, bank_accounts.account_number, donation_campaigns.title as campaign_title").
		Joins("left join bank_accounts on bank_accounts.id = donations.bank_account_id").
		Joins("left join donation_campaigns on donation_campaigns.id = donations.campaign_id").
		Order("donations.created_at desc").
		Limit(limit).
		Offset(offset).
		Scan(&rows)

	return c.JSON(fiber.Map{
		"data":  rows,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func AdminGetBankAccounts(c *fiber.Ctx) error {
	var accounts []models.BankAccount
	database.DB.Order("sort_order asc, created_at desc").Find(&accounts)
	return c.JSON(accounts)
}

func AdminCreateBankAccount(c *fiber.Ctx) error {
	type Input struct {
		BankName      string `json:"bank_name"`
		AccountNumber string `json:"account_number"`
		AccountHolder string `json:"account_holder"`
		Note          string `json:"note"`
		IsActive      *bool  `json:"is_active"`
		SortOrder     *int   `json:"sort_order"`
	}

	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	bankName := strings.TrimSpace(input.BankName)
	accountNumber := strings.TrimSpace(input.AccountNumber)
	accountHolder := strings.TrimSpace(input.AccountHolder)
	note := strings.TrimSpace(input.Note)

	if bankName == "" || accountNumber == "" || accountHolder == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Bank, nomor rekening, dan nama pemilik wajib diisi"})
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	sortOrder := 0
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	}

	account := models.BankAccount{
		ID:            uuid.New(),
		BankName:      bankName,
		AccountNumber: accountNumber,
		AccountHolder: accountHolder,
		Note:          note,
		IsActive:      isActive,
		SortOrder:     sortOrder,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := database.DB.Create(&account).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat rekening"})
	}

	return c.JSON(account)
}

func AdminUpdateBankAccount(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	accountID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID rekening tidak valid"})
	}

	type Input struct {
		BankName      *string `json:"bank_name"`
		AccountNumber *string `json:"account_number"`
		AccountHolder *string `json:"account_holder"`
		Note          *string `json:"note"`
		IsActive      *bool   `json:"is_active"`
		SortOrder     *int    `json:"sort_order"`
	}
	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	var account models.BankAccount
	if err := database.DB.Where("id = ?", accountID).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Rekening tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat rekening"})
	}

	if input.BankName != nil {
		val := strings.TrimSpace(*input.BankName)
		if val == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Bank wajib diisi"})
		}
		account.BankName = val
	}
	if input.AccountNumber != nil {
		val := strings.TrimSpace(*input.AccountNumber)
		if val == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Nomor rekening wajib diisi"})
		}
		account.AccountNumber = val
	}
	if input.AccountHolder != nil {
		val := strings.TrimSpace(*input.AccountHolder)
		if val == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Nama pemilik wajib diisi"})
		}
		account.AccountHolder = val
	}
	if input.Note != nil {
		account.Note = strings.TrimSpace(*input.Note)
	}
	if input.IsActive != nil {
		account.IsActive = *input.IsActive
	}
	if input.SortOrder != nil {
		account.SortOrder = *input.SortOrder
	}

	account.UpdatedAt = time.Now()

	if err := database.DB.Save(&account).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui rekening"})
	}

	return c.JSON(account)
}

func AdminDeleteBankAccount(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	accountID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID rekening tidak valid"})
	}

	if err := database.DB.Where("id = ?", accountID).Delete(&models.BankAccount{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus rekening"})
	}

	return c.JSON(fiber.Map{"message": "Rekening dihapus"})
}

func AdminGetDonationCampaigns(c *fiber.Ctx) error {
	db := database.DB

	var campaigns []models.DonationCampaign
	db.Order("sort_order asc, created_at desc").Find(&campaigns)

	type RaisedRow struct {
		CampaignID uuid.UUID
		Raised     int64
	}
	var raisedRows []RaisedRow
	db.Table("donations").
		Select("campaign_id, COALESCE(sum(amount), 0) as raised").
		Where("status = ? AND campaign_id IS NOT NULL", "approved").
		Group("campaign_id").
		Scan(&raisedRows)

	raisedByCampaignID := make(map[uuid.UUID]int64, len(raisedRows))
	for _, r := range raisedRows {
		raisedByCampaignID[r.CampaignID] = r.Raised
	}

	out := make([]fiber.Map, 0, len(campaigns))
	for _, cpn := range campaigns {
		raised := raisedByCampaignID[cpn.ID]
		progress := 0.0
		if cpn.TargetAmount > 0 {
			progress = (float64(raised) / float64(cpn.TargetAmount)) * 100.0
			if math.IsNaN(progress) || math.IsInf(progress, 0) {
				progress = 0
			}
			progress = math.Max(0, math.Min(100, progress))
		}
		out = append(out, fiber.Map{
			"id":               cpn.ID,
			"title":            cpn.Title,
			"description":      cpn.Description,
			"image_url":        cpn.ImageURL,
			"target_amount":    cpn.TargetAmount,
			"raised_amount":    raised,
			"currency":         cpn.Currency,
			"progress_percent": progress,
			"is_active":        cpn.IsActive,
			"sort_order":       cpn.SortOrder,
			"start_at":         cpn.StartAt,
			"end_at":           cpn.EndAt,
			"created_at":       cpn.CreatedAt,
			"updated_at":       cpn.UpdatedAt,
		})
	}

	return c.JSON(out)
}

func AdminCreateDonationCampaign(c *fiber.Ctx) error {
	type Input struct {
		Title        string  `json:"title"`
		Description  string  `json:"description"`
		ImageURL     string  `json:"image_url"`
		TargetAmount int64   `json:"target_amount"`
		IsActive     *bool   `json:"is_active"`
		SortOrder    *int    `json:"sort_order"`
		StartAt      *string `json:"start_at"`
		EndAt        *string `json:"end_at"`
	}

	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Judul program wajib diisi"})
	}

	imageURL, err := normalizeImageURL(input.ImageURL)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ImageURL tidak valid"})
	}

	if input.TargetAmount < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Target tidak valid"})
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	sortOrder := 0
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	}

	parseTime := func(s *string) (*time.Time, error) {
		if s == nil {
			return nil, nil
		}
		val := strings.TrimSpace(*s)
		if val == "" {
			return nil, nil
		}
		if t, err := time.Parse(time.RFC3339, val); err == nil {
			return &t, nil
		}
		if t, err := time.Parse("2006-01-02", val); err == nil {
			return &t, nil
		}
		return nil, errors.New("invalid time")
	}

	startAt, err := parseTime(input.StartAt)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "StartAt tidak valid"})
	}
	endAt, err := parseTime(input.EndAt)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "EndAt tidak valid"})
	}

	cpn := models.DonationCampaign{
		ID:           uuid.New(),
		Title:        title,
		Description:  strings.TrimSpace(input.Description),
		ImageURL:     imageURL,
		TargetAmount: input.TargetAmount,
		Currency:     "IDR",
		IsActive:     isActive,
		SortOrder:    sortOrder,
		StartAt:      startAt,
		EndAt:        endAt,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := database.DB.Create(&cpn).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat program donasi"})
	}

	return c.JSON(cpn)
}

func AdminUpdateDonationCampaign(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	campaignID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID program tidak valid"})
	}

	type Input struct {
		Title        *string `json:"title"`
		Description  *string `json:"description"`
		ImageURL     *string `json:"image_url"`
		TargetAmount *int64  `json:"target_amount"`
		IsActive     *bool   `json:"is_active"`
		SortOrder    *int    `json:"sort_order"`
		StartAt      *string `json:"start_at"`
		EndAt        *string `json:"end_at"`
	}
	var input Input
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	var cpn models.DonationCampaign
	if err := database.DB.Where("id = ?", campaignID).First(&cpn).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Program donasi tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat program donasi"})
	}

	parseTime := func(s *string) (*time.Time, error) {
		if s == nil {
			return nil, nil
		}
		val := strings.TrimSpace(*s)
		if val == "" {
			return nil, nil
		}
		if t, err := time.Parse(time.RFC3339, val); err == nil {
			return &t, nil
		}
		if t, err := time.Parse("2006-01-02", val); err == nil {
			return &t, nil
		}
		return nil, errors.New("invalid time")
	}

	if input.Title != nil {
		val := strings.TrimSpace(*input.Title)
		if val == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Judul program wajib diisi"})
		}
		cpn.Title = val
	}
	if input.Description != nil {
		cpn.Description = strings.TrimSpace(*input.Description)
	}
	if input.ImageURL != nil {
		val, err := normalizeImageURL(*input.ImageURL)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "ImageURL tidak valid"})
		}
		cpn.ImageURL = val
	}
	if input.TargetAmount != nil {
		if *input.TargetAmount < 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Target tidak valid"})
		}
		cpn.TargetAmount = *input.TargetAmount
	}
	if input.IsActive != nil {
		cpn.IsActive = *input.IsActive
	}
	if input.SortOrder != nil {
		cpn.SortOrder = *input.SortOrder
	}
	if input.StartAt != nil {
		t, err := parseTime(input.StartAt)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "StartAt tidak valid"})
		}
		cpn.StartAt = t
	}
	if input.EndAt != nil {
		t, err := parseTime(input.EndAt)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "EndAt tidak valid"})
		}
		cpn.EndAt = t
	}

	cpn.UpdatedAt = time.Now()
	if err := database.DB.Save(&cpn).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui program donasi"})
	}

	return c.JSON(cpn)
}

func AdminDeleteDonationCampaign(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	campaignID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID program tidak valid"})
	}

	if err := database.DB.Where("id = ?", campaignID).Delete(&models.DonationCampaign{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus program donasi"})
	}

	return c.JSON(fiber.Map{"message": "Program donasi dihapus"})
}
