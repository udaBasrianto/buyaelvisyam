package handlers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type orderItemInput struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type createOrderInput struct {
	Method          string           `json:"method"`
	CustomerName    string           `json:"customer_name"`
	CustomerPhone   string           `json:"customer_phone"`
	CustomerEmail   string           `json:"customer_email"`
	RecipientName   string           `json:"recipient_name"`
	AddressLine1    string           `json:"address_line_1"`
	AddressLine2    string           `json:"address_line_2"`
	City            string           `json:"city"`
	Province        string           `json:"province"`
	PostalCode      string           `json:"postal_code"`
	Courier         string           `json:"courier"`
	ShippingService string           `json:"shipping_service"`
	Notes           string           `json:"notes"`
	Items           []orderItemInput `json:"items"`
}

type updateOrderStatusInput struct {
	Status           string `json:"status"`
	PaymentStatus    string `json:"payment_status"`
	PaymentReference string `json:"payment_reference"`
	AdminNote        string `json:"admin_note"`
}

func normalizeOrderMethod(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "whatsapp":
		return "whatsapp"
	default:
		return "web"
	}
}

func normalizeOrderStatus(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "confirmed":
		return "confirmed"
	case "processed":
		return "processed"
	case "completed":
		return "completed"
	case "cancelled":
		return "cancelled"
	default:
		return "pending"
	}
}

func normalizePaymentStatus(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "paid":
		return "paid"
	case "payment_review":
		return "payment_review"
	case "cancelled":
		return "cancelled"
	default:
		return "awaiting_payment"
	}
}

func generateOrderCode() string {
	return fmt.Sprintf("ORD-%s-%s", time.Now().Format("20060102-150405"), strings.ToUpper(uuid.NewString()[:6]))
}

func generateOrderPublicToken() string {
	return strings.ReplaceAll(uuid.NewString(), "-", "") + strings.ReplaceAll(uuid.NewString(), "-", "")
}

func buildPaymentInstructions(settings models.SiteSettings, accounts []models.BankAccount, order models.ProductOrder) string {
	lines := []string{
		fmt.Sprintf("Transfer pembayaran untuk order %s.", order.OrderCode),
	}
	if order.PaymentDueAt != nil {
		lines = append(lines, fmt.Sprintf("Batas pembayaran: %s", order.PaymentDueAt.Format("02 Jan 2006 15:04")))
	}
	if strings.TrimSpace(settings.CheckoutInstructions) != "" {
		lines = append(lines, strings.TrimSpace(settings.CheckoutInstructions))
	}
	if len(accounts) > 0 {
		lines = append(lines, "Rekening tujuan:")
		for _, account := range accounts {
			lines = append(lines, fmt.Sprintf("- %s %s a.n. %s", account.BankName, account.AccountNumber, account.AccountHolder))
		}
	}
	return strings.Join(lines, "\n")
}

func loadActiveBankAccounts(tx *gorm.DB) []models.BankAccount {
	var accounts []models.BankAccount
	tx.Where("is_active = ?", true).Order("sort_order asc, created_at desc").Find(&accounts)
	return accounts
}

func applyOrderInventory(tx *gorm.DB, items []models.ProductOrderItem, mode string) error {
	for _, item := range items {
		if item.ProductType != "physical" || item.Quantity <= 0 {
			continue
		}

		var product models.Product
		if err := tx.Where("id = ?", item.ProductID).First(&product).Error; err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "Produk order tidak ditemukan")
		}

		switch mode {
		case "deduct":
			if product.Stock < item.Quantity {
				return fiber.NewError(fiber.StatusBadRequest, fmt.Sprintf("Stok produk %s tidak mencukupi", item.ProductTitle))
			}
			if err := tx.Model(&product).Update("stock", product.Stock-item.Quantity).Error; err != nil {
				return err
			}
		case "restore":
			if err := tx.Model(&product).Update("stock", product.Stock+item.Quantity).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func serializePublicOrder(order models.ProductOrder, accounts []models.BankAccount) fiber.Map {
	accountRows := make([]fiber.Map, 0, len(accounts))
	for _, account := range accounts {
		accountRows = append(accountRows, fiber.Map{
			"id":             account.ID,
			"bank_name":      account.BankName,
			"account_number": account.AccountNumber,
			"account_holder": account.AccountHolder,
			"note":           account.Note,
		})
	}

	return fiber.Map{
		"id":                   order.ID,
		"public_token":         order.PublicToken,
		"order_code":           order.OrderCode,
		"method":               order.Method,
		"status":               order.Status,
		"customer_name":        order.CustomerName,
		"customer_phone":       order.CustomerPhone,
		"customer_email":       order.CustomerEmail,
		"recipient_name":       order.RecipientName,
		"address_line_1":       order.AddressLine1,
		"address_line_2":       order.AddressLine2,
		"city":                 order.City,
		"province":             order.Province,
		"postal_code":          order.PostalCode,
		"courier":              order.Courier,
		"shipping_service":     order.ShippingService,
		"notes":                order.Notes,
		"currency":             order.Currency,
		"subtotal_amount":      order.SubtotalAmount,
		"shipping_amount":      order.ShippingAmount,
		"discount_amount":      order.DiscountAmount,
		"total_amount":         order.TotalAmount,
		"requires_shipping":    order.RequiresShipping,
		"payment_method":       order.PaymentMethod,
		"payment_status":       order.PaymentStatus,
		"payment_reference":    order.PaymentReference,
		"payment_instructions": order.PaymentInstructions,
		"payment_due_at":       order.PaymentDueAt,
		"created_at":           order.CreatedAt,
		"updated_at":           order.UpdatedAt,
		"items":                order.Items,
		"bank_accounts":        accountRows,
	}
}

func CreateOrder(c *fiber.Ctx) error {
	var input createOrderInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	input.Method = normalizeOrderMethod(input.Method)
	input.CustomerName = strings.TrimSpace(input.CustomerName)
	input.CustomerPhone = strings.TrimSpace(input.CustomerPhone)
	input.CustomerEmail = strings.TrimSpace(input.CustomerEmail)
	input.RecipientName = strings.TrimSpace(input.RecipientName)
	input.AddressLine1 = strings.TrimSpace(input.AddressLine1)
	input.AddressLine2 = strings.TrimSpace(input.AddressLine2)
	input.City = strings.TrimSpace(input.City)
	input.Province = strings.TrimSpace(input.Province)
	input.PostalCode = strings.TrimSpace(input.PostalCode)
	input.Courier = strings.TrimSpace(input.Courier)
	input.ShippingService = strings.TrimSpace(input.ShippingService)
	input.Notes = strings.TrimSpace(input.Notes)

	if input.CustomerName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nama pembeli wajib diisi"})
	}
	if input.CustomerPhone == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nomor WhatsApp pembeli wajib diisi"})
	}
	if len(input.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Item order tidak boleh kosong"})
	}

	customerPhone, err := normalizeWhatsAppNumber(input.CustomerPhone)
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nomor WhatsApp pembeli tidak valid"})
	}

	idempotencyKey := strings.TrimSpace(c.Get("Idempotency-Key"))
	if idempotencyKey != "" {
		var existing models.ProductOrder
		if err := database.DB.Preload("Items").Where("idempotency_key = ?", idempotencyKey).First(&existing).Error; err == nil {
			accounts := loadActiveBankAccounts(database.DB)
			return c.JSON(fiber.Map{
				"order": serializePublicOrder(existing, accounts),
			})
		}
	}

	var settings models.SiteSettings
	database.DB.First(&settings)

	if input.Method == "web" && !settings.CheckoutWebEnabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Checkout via web sedang dinonaktifkan"})
	}
	if input.Method == "whatsapp" && !settings.CheckoutWhatsAppEnabled {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Checkout via WhatsApp sedang dinonaktifkan"})
	}

	checkoutWhatsAppNumber := strings.TrimSpace(settings.CheckoutWhatsAppNumber)
	if input.Method == "whatsapp" && checkoutWhatsAppNumber == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nomor WhatsApp checkout belum dikonfigurasi admin"})
	}

	userID := getOptionalUserID(c)
	order := models.ProductOrder{
		ID:              uuid.New(),
		OrderCode:       generateOrderCode(),
		PublicToken:     generateOrderPublicToken(),
		IdempotencyKey:  idempotencyKey,
		UserID:          userID,
		Method:          input.Method,
		Status:          "pending",
		CustomerName:    input.CustomerName,
		CustomerPhone:   customerPhone,
		CustomerEmail:   input.CustomerEmail,
		RecipientName:   input.RecipientName,
		AddressLine1:    input.AddressLine1,
		AddressLine2:    input.AddressLine2,
		City:            input.City,
		Province:        input.Province,
		PostalCode:      input.PostalCode,
		Courier:         input.Courier,
		ShippingService: input.ShippingService,
		Notes:           input.Notes,
		Currency:        "IDR",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	orderItems := make([]models.ProductOrderItem, 0, len(input.Items))
	subtotalAmount := 0.0
	orderCurrency := "IDR"
	requiresShipping := false

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		for _, rawItem := range input.Items {
			rawItem.ProductID = strings.TrimSpace(rawItem.ProductID)
			if rawItem.ProductID == "" {
				return fiber.NewError(fiber.StatusBadRequest, "Produk order tidak valid")
			}
			if rawItem.Quantity <= 0 {
				return fiber.NewError(fiber.StatusBadRequest, "Jumlah item order tidak valid")
			}

			productID, err := uuid.Parse(rawItem.ProductID)
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "Produk order tidak valid")
			}

			var product models.Product
			if err := tx.Where("id = ?", productID).Where("is_active = ?", true).First(&product).Error; err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "Produk tidak ditemukan atau tidak aktif")
			}

			lineTotal := float64(rawItem.Quantity) * product.Price
			orderItems = append(orderItems, models.ProductOrderItem{
				ID:           uuid.New(),
				OrderID:      order.ID,
				ProductID:    product.ID,
				ProductTitle: product.Title,
				ProductSlug:  product.Slug,
				ProductType:  product.ProductType,
				Quantity:     rawItem.Quantity,
				UnitPrice:    product.Price,
				LineTotal:    lineTotal,
				Currency:     product.Currency,
				ImageURL:     product.ImageURL,
				CreatedAt:    time.Now(),
			})
			subtotalAmount += lineTotal
			if strings.TrimSpace(product.Currency) != "" {
				orderCurrency = product.Currency
			}
			if product.ProductType == "physical" {
				requiresShipping = true
			}
		}

		if requiresShipping {
			recipientName := strings.TrimSpace(order.RecipientName)
			if recipientName == "" {
				recipientName = order.CustomerName
				order.RecipientName = recipientName
			}
			if recipientName == "" || order.AddressLine1 == "" || order.City == "" || order.Province == "" || order.PostalCode == "" || order.Courier == "" || order.ShippingService == "" {
				return fiber.NewError(fiber.StatusBadRequest, "Data pengiriman wajib dilengkapi untuk produk fisik")
			}
			if !settings.CheckoutFlatShippingEnabled || settings.CheckoutFlatShippingAmount <= 0 {
				return fiber.NewError(fiber.StatusBadRequest, "Biaya kirim checkout belum dikonfigurasi admin")
			}
			order.ShippingAmount = settings.CheckoutFlatShippingAmount
		}

		order.SubtotalAmount = subtotalAmount
		order.TotalAmount = subtotalAmount + order.ShippingAmount - order.DiscountAmount
		order.Currency = orderCurrency
		order.RequiresShipping = requiresShipping

		if input.Method == "web" {
			order.PaymentMethod = "bank_transfer"
			order.PaymentStatus = "awaiting_payment"
			order.PaymentReference = order.OrderCode
			if settings.CheckoutPaymentDueHours <= 0 {
				settings.CheckoutPaymentDueHours = 24
			}
			paymentDue := time.Now().Add(time.Duration(settings.CheckoutPaymentDueHours) * time.Hour)
			order.PaymentDueAt = &paymentDue
			accounts := loadActiveBankAccounts(tx)
			order.PaymentInstructions = buildPaymentInstructions(settings, accounts, order)
			if len(accounts) == 0 {
				return fiber.NewError(fiber.StatusBadRequest, "Rekening pembayaran belum dikonfigurasi admin")
			}
		} else {
			order.PaymentMethod = "whatsapp_manual"
			order.PaymentStatus = "awaiting_payment"
			order.PaymentReference = order.OrderCode
			order.PaymentInstructions = buildPaymentInstructions(settings, loadActiveBankAccounts(tx), order)
		}

		if err := applyOrderInventory(tx, orderItems, "deduct"); err != nil {
			return err
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		order.Items = orderItems
		return nil
	})
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat order"})
	}

	accounts := loadActiveBankAccounts(database.DB)
	return c.JSON(fiber.Map{
		"order":                    serializePublicOrder(order, accounts),
		"checkout_whatsapp_number": checkoutWhatsAppNumber,
	})
}

func GetPublicOrderByToken(c *fiber.Ctx) error {
	token := strings.TrimSpace(c.Params("token"))
	if token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Token order wajib diisi"})
	}

	var order models.ProductOrder
	if err := database.DB.Preload("Items").Where("public_token = ?", token).First(&order).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Order tidak ditemukan"})
	}

	accounts := loadActiveBankAccounts(database.DB)
	return c.JSON(fiber.Map{
		"order": serializePublicOrder(order, accounts),
	})
}

func AdminGetOrders(c *fiber.Ctx) error {
	db := database.DB
	var orders []models.ProductOrder

	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	method := strings.TrimSpace(strings.ToLower(c.Query("method")))
	search := strings.TrimSpace(strings.ToLower(c.Query("search")))

	page := 1
	limit := 20
	fmt.Sscanf(c.Query("page", "1"), "%d", &page)
	fmt.Sscanf(c.Query("limit", "20"), "%d", &limit)
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

	query := db.Model(&models.ProductOrder{})
	if status != "" && status != "all" {
		query = query.Where("status = ?", normalizeOrderStatus(status))
	}
	if method != "" && method != "all" {
		query = query.Where("method = ?", normalizeOrderMethod(method))
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("LOWER(order_code) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR customer_phone LIKE ?", like, like, like, like)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menghitung order"})
	}

	if err := query.Preload("Items").Order("created_at desc").Limit(limit).Offset(offset).Find(&orders).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memuat order"})
	}

	return c.JSON(fiber.Map{
		"data":  orders,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func AdminUpdateOrderStatus(c *fiber.Ctx) error {
	orderID := strings.TrimSpace(c.Params("id"))
	if orderID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID order wajib diisi"})
	}

	var input updateOrderStatusInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	nextStatus := normalizeOrderStatus(input.Status)
	nextPaymentStatus := normalizePaymentStatus(input.PaymentStatus)
	adminNote := strings.TrimSpace(input.AdminNote)
	paymentReference := strings.TrimSpace(input.PaymentReference)

	var updated models.ProductOrder
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var order models.ProductOrder
		if err := tx.Preload("Items").Where("id = ?", orderID).First(&order).Error; err != nil {
			return fiber.NewError(fiber.StatusNotFound, "Order tidak ditemukan")
		}

		if order.Status != nextStatus {
			if order.Status != "cancelled" && nextStatus == "cancelled" {
				if err := applyOrderInventory(tx, order.Items, "restore"); err != nil {
					return err
				}
			}
			if order.Status == "cancelled" && nextStatus != "cancelled" {
				if err := applyOrderInventory(tx, order.Items, "deduct"); err != nil {
					return err
				}
			}
		}

		if nextStatus == "cancelled" {
			nextPaymentStatus = "cancelled"
		}

		updates := map[string]any{
			"status":            nextStatus,
			"payment_status":    nextPaymentStatus,
			"payment_reference": paymentReference,
			"admin_note":        adminNote,
			"updated_at":        time.Now(),
		}

		if err := tx.Model(&order).Updates(updates).Error; err != nil {
			return err
		}
		if err := tx.Preload("Items").Where("id = ?", order.ID).First(&updated).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		if ferr, ok := err.(*fiber.Error); ok {
			return c.Status(ferr.Code).JSON(fiber.Map{"error": ferr.Message})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memperbarui status order"})
	}

	return c.JSON(updated)
}
