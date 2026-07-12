package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// BeforeCreate hooks to generate UUIDs
func (m *Profile) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *UserRole) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Category) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Article) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Page) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *SiteSettings) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *AccessLog) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *FeatureItem) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Comment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Transaction) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Visit) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Widget) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *QuizQuestion) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Course) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *CourseModule) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Lesson) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Enrollment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *NavItem) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Bookmark) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ProductOrder) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ProductOrderItem) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type Profile struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID           uuid.UUID `gorm:"type:uuid;unique;not null" json:"user_id"`
	Email            string    `gorm:"unique;not null" json:"email"`
	Password         string    `json:"-"`
	DisplayName      string    `json:"display_name"`
	AvatarURL        string    `json:"avatar_url"`
	WhatsAppNumber   *string   `gorm:"uniqueIndex" json:"whatsapp_number"`
	WhatsAppVerified bool      `gorm:"default:false" json:"whatsapp_verified"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Balance          float64   `gorm:"default:0" json:"balance"`
	Role             string    `gorm:"-" json:"role"` // Helper field for response
}

type UserRole struct {
	ID     uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Role   string    `gorm:"not null;default:'pembaca'" json:"role"`
}

type Category struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Slug         string    `gorm:"unique;not null" json:"slug"`
	Color        string    `gorm:"default:'bg-primary/10 text-primary'" json:"color"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	SortOrder    int       `gorm:"default:0" json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	ArticleCount int       `gorm:"-" json:"article_count"`
}

type Article struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Title              string         `gorm:"not null" json:"title"`
	Slug               string         `gorm:"unique;not null" json:"slug"`
	Content            string         `json:"content"`
	Excerpt            string         `json:"excerpt"`
	CoverImage         string         `json:"cover_image"`
	Category           string         `json:"category"`
	Categories         pq.StringArray `gorm:"type:text[]" json:"categories"`
	Tags               pq.StringArray `gorm:"type:text[]" json:"tags"`
	Status             string         `gorm:"default:'draft'" json:"status"`
	TemplateType       string         `gorm:"default:'kajian'" json:"template_type"`
	ScheduledPublishAt *time.Time     `json:"scheduled_publish_at"`
	Views              int            `gorm:"default:0" json:"views"`
	IsFeatured         bool           `gorm:"default:false" json:"is_featured"`
	LocationName       string         `json:"location_name"`
	Latitude           float64        `json:"latitude"`
	Longitude          float64        `json:"longitude"`
	YoutubeURL         string         `json:"youtube_url"`
	AuthorID           uuid.UUID      `gorm:"type:uuid" json:"author_id"`
	WPID               int            `json:"wp_id"` // Store original WordPress ID to prevent duplicates
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	AuthorName         string         `gorm:"-" json:"author"`        // For response
	CommentCount       int64          `gorm:"-" json:"comment_count"` // For response
}

type ArticleRevision struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	ArticleID          uuid.UUID      `gorm:"type:uuid;index" json:"article_id"`
	Title              string         `json:"title"`
	Content            string         `json:"content"`
	Excerpt            string         `json:"excerpt"`
	CoverImage         string         `json:"cover_image"`
	Category           string         `json:"category"`
	Categories         pq.StringArray `gorm:"type:text[]" json:"categories"`
	Tags               pq.StringArray `gorm:"type:text[]" json:"tags"`
	Status             string         `json:"status"`
	TemplateType       string         `json:"template_type"`
	ScheduledPublishAt *time.Time     `json:"scheduled_publish_at"`
	SavedBy            uuid.UUID      `gorm:"type:uuid" json:"saved_by"`
	CreatedAt          time.Time      `json:"created_at"`
}

type Page struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title        string    `gorm:"not null" json:"title"`
	Slug         string    `gorm:"unique;not null" json:"slug"`
	Content      string    `json:"content"`
	Excerpt      string    `json:"excerpt"`
	Status       string    `gorm:"default:'draft'" json:"status"`
	ShowInNav    bool      `gorm:"default:false" json:"show_in_nav"`
	NavOrder     int       `gorm:"default:0" json:"nav_order"`
	TemplateType string    `gorm:"default:'standard'" json:"template_type"` // standard, landing, sidebar
	HeroImage    string    `json:"hero_image"`
	CreatedBy    uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type SiteSettings struct {
	ID                           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SiteName                     string    `gorm:"default:'BlogUstad'" json:"site_name"`
	Tagline                      string    `json:"tagline"`
	SiteDescription              string    `json:"site_description"`
	LogoURL                      string    `json:"logo_url"`
	FaviconURL                   string    `json:"favicon_url"`
	DefaultArticleImage          string    `json:"default_article_image"`
	FooterText                   string    `json:"footer_text"`
	GoogleClientID               string    `json:"google_client_id"`
	WhatsAppNotificationsEnabled bool      `gorm:"default:false" json:"whatsapp_notifications_enabled"`
	WhatsAppNotifyNewArticle     bool      `gorm:"default:true" json:"whatsapp_notify_new_article"`
	WhatsAppNotifyNewCourse      bool      `gorm:"default:true" json:"whatsapp_notify_new_course"`
	WhatsAppNotifyMaxRecipients  int       `gorm:"default:200" json:"whatsapp_notify_max_recipients"`
	WhatsAppTemplateNewArticle   string    `json:"whatsapp_template_new_article"`
	WhatsAppTemplateNewCourse    string    `json:"whatsapp_template_new_course"`
	HomepageVersion              string    `gorm:"default:'v1'" json:"homepage_version"`
	ScrollToTopVersion           string    `gorm:"default:'animated'" json:"scroll_to_top_version"`
	AdminToken                   string    `gorm:"default:'090124'" json:"admin_token"`
	SliderStyle                  string    `gorm:"default:'v2'" json:"slider_style"`
	NewsletterTitle              string    `json:"newsletter_title"`
	NewsletterDescription        string    `json:"newsletter_description"`
	NewsletterButtonText         string    `json:"newsletter_button_text"`
	NewsletterLink               string    `json:"newsletter_link"`
	AdminSlug                    string    `gorm:"default:'yaakhi'" json:"admin_slug"`
	HeroTitle                    string    `gorm:"default:'Editors Choice'" json:"hero_title"`
	RecentTitle                  string    `gorm:"default:'Recent Stories'" json:"recent_title"`
	RecentLimit                  int       `gorm:"default:20" json:"recent_limit"`
	SliderOverlayOpacity         int       `gorm:"default:85" json:"slider_overlay_opacity"`
	ThemeColor                   string    `gorm:"default:'emerald'" json:"theme_color"`
	AboutHeroImage               string    `json:"about_hero_image"`
	AboutVisionImage1            string    `json:"about_vision_image_1"`
	AboutVisionImage2            string    `json:"about_vision_image_2"`
	AboutValue1Title             string    `json:"about_value_1_title"`
	AboutValue1Desc              string    `json:"about_value_1_desc"`
	AboutValue2Title             string    `json:"about_value_2_title"`
	AboutValue2Desc              string    `json:"about_value_2_desc"`
	AboutValue3Title             string    `json:"about_value_3_title"`
	AboutValue3Desc              string    `json:"about_value_3_desc"`
	AboutContactEmail            string    `json:"about_contact_email"`
	AboutContactPhone            string    `json:"about_contact_phone"`
	AboutFooterQuote             string    `json:"about_footer_quote"`
	AboutFooterAuthor            string    `json:"about_footer_author"`
	GoogleAnalyticsID            string    `json:"google_analytics_id"`
	CategoriesTitle              string    `json:"categories_title"`
	CategoriesSubtitle           string    `json:"categories_subtitle"`
	LmsMenuLabel                 string    `gorm:"default:'Akademi'" json:"lms_menu_label"`
	LmsTitle                     string    `gorm:"default:'Belajar Islam Lebih Terstruktur.'" json:"lms_title"`
	LmsSubtitle                  string    `gorm:"default:'Akses materi kajian eksklusif, video tutorial, dan kuis interaktif dari Ustadz-Ustadz terpercaya.'" json:"lms_subtitle"`
	ProductsMenuLabel            string    `gorm:"default:'Produk'" json:"products_menu_label"`
	ProductsTitle                string    `gorm:"default:'Daftar Produk'" json:"products_title"`
	ProductsSubtitle             string    `gorm:"default:'Lihat produk fisik dan digital yang tersedia.'" json:"products_subtitle"`
	CheckoutWebEnabled           bool      `gorm:"column:checkout_web_enabled;default:true" json:"checkout_web_enabled"`
	CheckoutWhatsAppEnabled      bool      `gorm:"column:checkout_whatsapp_enabled;default:true" json:"checkout_whatsapp_enabled"`
	CheckoutWhatsAppNumber       string    `gorm:"column:checkout_whatsapp_number" json:"checkout_whatsapp_number"`
	CheckoutInstructions         string    `json:"checkout_instructions"`
	CheckoutFlatShippingEnabled  bool      `gorm:"default:false" json:"checkout_flat_shipping_enabled"`
	CheckoutFlatShippingAmount   float64   `gorm:"default:0" json:"checkout_flat_shipping_amount"`
	CheckoutFlatShippingLabel    string    `gorm:"default:'Ongkos Kirim'" json:"checkout_flat_shipping_label"`
	CheckoutPaymentDueHours      int       `gorm:"default:24" json:"checkout_payment_due_hours"`
	ShowFeatureBar               bool      `gorm:"default:true" json:"show_feature_bar"`
	ShowChatbot                  bool      `gorm:"default:true" json:"show_chatbot"`
	DonationTitle                string    `gorm:"default:'Donasi'" json:"donation_title"`
	DonationDescription          string    `json:"donation_description"`
	DonationInstructions         string    `json:"donation_instructions"`
	ShowDonors                   bool      `gorm:"default:true" json:"show_donors"`
	UpdatedBy                    uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	UpdatedAt                    time.Time `json:"updated_at"`
}

type AccessLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	IP        string    `json:"ip"`
	Path      string    `json:"path"`
	UserAgent string    `json:"user_agent"`
	Location  string    `json:"location"` // City, Country
	Status    string    `json:"status"`   // "success", "failed", "blocked"
	CreatedAt time.Time `json:"created_at"`
}

type FeatureItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Icon      string    `gorm:"not null" json:"icon"`
	Label     string    `gorm:"not null" json:"label"`
	Link      string    `json:"link"`
	Color     string    `gorm:"default:'emerald'" json:"color"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}

type Comment struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	ArticleID    uuid.UUID  `gorm:"type:uuid;not null" json:"article_id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Content      string     `gorm:"not null" json:"content"`
	ParentID     *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	Status       string     `gorm:"default:'approved'" json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DisplayName  string     `gorm:"-" json:"display_name"`
	Initials     string     `gorm:"-" json:"initials"`
	ArticleTitle string     `gorm:"-" json:"article_title"`
	IsStaff      bool       `gorm:"-" json:"is_staff"`
	UserRole     string     `gorm:"-" json:"user_role"`
}

type UploadAsset struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	URL        string    `gorm:"not null" json:"url"`
	Filename   string    `json:"filename"`
	MimeType   string    `json:"mime_type"`
	SizeBytes  int64     `json:"size_bytes"`
	UploaderID uuid.UUID `gorm:"type:uuid" json:"uploader_id"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdminAuditLog struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Role       string    `json:"role"`
	Method     string    `json:"method"`
	Path       string    `json:"path"`
	StatusCode int       `json:"status_code"`
	IP         string    `json:"ip"`
	UserAgent  string    `json:"user_agent"`
	CreatedAt  time.Time `json:"created_at"`
}

type WhatsAppBroadcastLog struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedBy     uuid.UUID `gorm:"type:uuid;index" json:"created_by"`
	Message       string    `gorm:"type:text;not null" json:"message"`
	MaxRecipients int       `gorm:"default:200" json:"max_recipients"`
	SentCount     int       `gorm:"default:0" json:"sent_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type Transaction struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`                            // topup, payment
	Status    string    `gorm:"default:'pending'" json:"status"` // pending, success, failed
	Reference string    `json:"reference"`                       // description or course title
	ProofURL  string    `json:"proof_url"`
	CreatedAt time.Time `json:"created_at"`
}

type Donation struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID              *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	BankAccountID       *uuid.UUID `gorm:"type:uuid" json:"bank_account_id"`
	CampaignID          *uuid.UUID `gorm:"type:uuid;index" json:"campaign_id"`
	Amount              int64      `gorm:"not null" json:"amount"`
	Currency            string     `gorm:"default:'IDR'" json:"currency"`
	DonorName           string     `json:"donor_name"`
	IsAnonymous         bool       `gorm:"default:false" json:"is_anonymous"`
	WhatsAppNumber      *string    `json:"whatsapp_number"`
	Message             string     `json:"message"`
	ProofURL            string     `json:"proof_url"`
	SenderName          string     `json:"sender_name"`
	SenderBank          string     `json:"sender_bank"`
	SenderAccountNumber string     `json:"sender_account_number"`
	TransferDate        *time.Time `json:"transfer_date"`
	Status              string     `gorm:"default:'pending'" json:"status"`
	AdminNote           string     `json:"admin_note"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type DonationCampaign struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Title        string     `gorm:"not null" json:"title"`
	Description  string     `json:"description"`
	ImageURL     string     `json:"image_url"`
	TargetAmount int64      `gorm:"not null;default:0" json:"target_amount"`
	Currency     string     `gorm:"default:'IDR'" json:"currency"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	SortOrder    int        `gorm:"default:0" json:"sort_order"`
	StartAt      *time.Time `json:"start_at"`
	EndAt        *time.Time `json:"end_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type BankAccount struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	BankName      string    `gorm:"not null" json:"bank_name"`
	AccountNumber string    `gorm:"not null" json:"account_number"`
	AccountHolder string    `gorm:"not null" json:"account_holder"`
	Note          string    `json:"note"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	SortOrder     int       `gorm:"default:0" json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Visit struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	IP        string     `json:"ip"`
	Path      string     `json:"path"`
	UserAgent string     `json:"user_agent"`
	CreatedAt time.Time  `json:"created_at"`
}

type Widget struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Type      string    `gorm:"default:'html'" json:"type"` // html, image, categories, latest_posts
	Content   string    `json:"content"`                    // HTML code or text
	ImageURL  string    `json:"image_url"`                  // For image type
	LinkURL   string    `json:"link_url"`                   // Link for image
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	Placement string    `gorm:"default:'all'" json:"placement"` // all, beranda, detail
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Product struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string    `gorm:"not null" json:"title"`
	Slug           string    `gorm:"unique;not null" json:"slug"`
	Description    string    `json:"description"`
	ProductType    string    `gorm:"default:'physical'" json:"product_type"`
	Price          float64   `gorm:"default:0" json:"price"`
	Currency       string    `gorm:"default:'IDR'" json:"currency"`
	SKU            string    `json:"sku"`
	Stock          int       `gorm:"default:0" json:"stock"`
	DigitalFileURL string    `json:"digital_file_url"`
	ImageURL       string         `json:"image_url"`
	Images         pq.StringArray `gorm:"type:text[]" json:"images"`
	IsActive       bool           `gorm:"default:true" json:"is_active"`
	SortOrder      int            `gorm:"default:0" json:"sort_order"`
	Views          int        `gorm:"default:0" json:"views"`
	DiscountPrice  float64    `gorm:"default:0" json:"discount_price"`
	IsFlashSale    bool       `gorm:"default:false" json:"is_flash_sale"`
	FlashSaleStart *time.Time `json:"flash_sale_start"`
	FlashSaleEnd   *time.Time `json:"flash_sale_end"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// GetActivePrice returns the active price taking discount & flash sale into account
func (p *Product) GetActivePrice() float64 {
	if p.DiscountPrice > 0 && p.DiscountPrice < p.Price {
		if p.IsFlashSale {
			now := time.Now()
			if p.FlashSaleStart != nil && p.FlashSaleEnd != nil {
				if now.After(*p.FlashSaleStart) && now.Before(*p.FlashSaleEnd) {
					return p.DiscountPrice
				}
			} else if p.FlashSaleEnd != nil {
				if now.Before(*p.FlashSaleEnd) {
					return p.DiscountPrice
				}
			} else {
				return p.DiscountPrice
			}
		} else {
			return p.DiscountPrice
		}
	}
	return p.Price
}

type ProductOrder struct {
	ID                  uuid.UUID          `gorm:"type:uuid;primaryKey" json:"id"`
	OrderCode           string             `gorm:"uniqueIndex;not null" json:"order_code"`
	PublicToken         string             `gorm:"uniqueIndex" json:"public_token"`
	IdempotencyKey      string             `gorm:"index" json:"idempotency_key"`
	UserID              *uuid.UUID         `gorm:"type:uuid;index" json:"user_id"`
	Method              string             `gorm:"default:'web'" json:"method"`     // web, whatsapp
	Status              string             `gorm:"default:'pending'" json:"status"` // pending, confirmed, processed, completed, cancelled
	CustomerName        string             `gorm:"not null" json:"customer_name"`
	CustomerPhone       string             `gorm:"not null" json:"customer_phone"`
	CustomerEmail       string             `json:"customer_email"`
	RecipientName       string             `json:"recipient_name"`
	AddressLine1        string             `json:"address_line_1"`
	AddressLine2        string             `json:"address_line_2"`
	City                string             `json:"city"`
	Province            string             `json:"province"`
	PostalCode          string             `json:"postal_code"`
	Courier             string             `json:"courier"`
	ShippingService     string             `json:"shipping_service"`
	Notes               string             `gorm:"type:text" json:"notes"`
	Currency            string             `gorm:"default:'IDR'" json:"currency"`
	SubtotalAmount      float64            `gorm:"default:0" json:"subtotal_amount"`
	ShippingAmount      float64            `gorm:"default:0" json:"shipping_amount"`
	DiscountAmount      float64            `gorm:"default:0" json:"discount_amount"`
	TotalAmount         float64            `gorm:"default:0" json:"total_amount"`
	RequiresShipping    bool               `gorm:"default:false" json:"requires_shipping"`
	PaymentMethod       string             `gorm:"default:'manual'" json:"payment_method"`
	PaymentStatus       string             `gorm:"default:'awaiting_payment'" json:"payment_status"`
	PaymentReference    string             `json:"payment_reference"`
	PaymentInstructions string             `gorm:"type:text" json:"payment_instructions"`
	PaymentDueAt        *time.Time         `json:"payment_due_at"`
	AdminNote           string             `gorm:"type:text" json:"admin_note"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
	Items               []ProductOrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

type ProductOrderItem struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	OrderID      uuid.UUID `gorm:"type:uuid;index;not null" json:"order_id"`
	ProductID    uuid.UUID `gorm:"type:uuid;index;not null" json:"product_id"`
	ProductTitle string    `gorm:"not null" json:"product_title"`
	ProductSlug  string    `json:"product_slug"`
	ProductType  string    `json:"product_type"`
	Quantity     int       `gorm:"default:1" json:"quantity"`
	UnitPrice    float64   `gorm:"default:0" json:"unit_price"`
	LineTotal    float64   `gorm:"default:0" json:"line_total"`
	Currency     string    `gorm:"default:'IDR'" json:"currency"`
	ImageURL     string    `json:"image_url"`
	CreatedAt    time.Time `json:"created_at"`
}

type QuizQuestion struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ArticleID     uuid.UUID `gorm:"type:uuid;index" json:"article_id"`
	Question      string    `gorm:"not null" json:"question"`
	OptionA       string    `json:"option_a"`
	OptionB       string    `json:"option_b"`
	OptionC       string    `json:"option_c"`
	OptionD       string    `json:"option_d"`
	CorrectOption string    `json:"correct_option"` // A, B, C, or D
	Explanation   string    `json:"explanation"`
	CreatedAt     time.Time `json:"created_at"`
}

// LMS Models
type Course struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Slug        string    `gorm:"unique;not null" json:"slug"`
	Description string    `json:"description"`
	Thumbnail   string    `json:"thumbnail"`
	Price       float64   `gorm:"default:0" json:"price"`
	Instructor  string    `json:"instructor"`
	Level       string    `gorm:"default:'Pemula'" json:"level"` // Pemula, Menengah, Lanjut
	Category    string    `json:"category"`
	IsPublished bool      `gorm:"default:false" json:"is_published"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CourseModule struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null" json:"course_id"`
	Title     string    `gorm:"not null" json:"title"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type Lesson struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ModuleID    uuid.UUID `gorm:"type:uuid;not null" json:"module_id"`
	Title       string    `gorm:"not null" json:"title"`
	Slug        string    `gorm:"unique;not null" json:"slug"`
	ContentType string    `gorm:"default:'video'" json:"content_type"` // video, text, quiz
	Content     string    `json:"content"`                             // URL for video or HTML for text
	Duration    string    `json:"duration"`                            // e.g. "10:00"
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	IsFree      bool      `gorm:"default:false" json:"is_free"`
	CreatedAt   time.Time `json:"created_at"`
}

type LessonProgress struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index:idx_user_lesson,unique" json:"user_id"`
	LessonID    uuid.UUID `gorm:"type:uuid;not null;index:idx_user_lesson,unique" json:"lesson_id"`
	CompletedAt time.Time `json:"completed_at"`
}

type Enrollment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null" json:"course_id"`
	Status    string    `gorm:"default:'pending'" json:"status"` // pending, active
	CreatedAt time.Time `json:"created_at"`
}

type NavItem struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Label      string     `json:"label"`
	URL        string     `json:"url"`
	SortOrder  int        `json:"sort_order"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	IsExternal bool       `gorm:"default:false" json:"is_external"`
	ParentID   *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type Bookmark struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_user_article" json:"user_id"`
	ArticleID uuid.UUID `gorm:"type:uuid;not null;index:idx_user_article" json:"article_id"`
	CreatedAt time.Time `json:"created_at"`
}

type ReadingProgress struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_reading_user_article,unique" json:"user_id"`
	ArticleID uuid.UUID `gorm:"type:uuid;not null;index:idx_reading_user_article,unique" json:"article_id"`
	Progress  float64   `gorm:"default:0" json:"progress"`
	UpdatedAt time.Time `json:"updated_at"`
}
