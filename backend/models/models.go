package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// BeforeCreate hooks to generate UUIDs
func (m *Profile) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *UserRole) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Category) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Article) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Page) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *SiteSettings) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *AccessLog) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *FeatureItem) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Comment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Transaction) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Visit) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Widget) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *QuizQuestion) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Course) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *CourseModule) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Lesson) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Enrollment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *NavItem) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

func (m *Bookmark) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil { m.ID = uuid.New() }
	return nil
}

type Profile struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID            uuid.UUID  `gorm:"type:uuid;unique;not null" json:"user_id"`
	Email             string     `gorm:"unique;not null" json:"email"`
	Password          string     `json:"-"`
	DisplayName       string     `json:"display_name"`
	AvatarURL         string     `json:"avatar_url"`
	WhatsAppNumber    string     `gorm:"unique" json:"whatsapp_number"`
	WhatsAppVerified  bool       `gorm:"default:false" json:"whatsapp_verified"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	Balance           float64    `gorm:"default:0" json:"balance"`
	Role              string     `gorm:"-" json:"role"` // Helper field for response
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
	ID         uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Title      string         `gorm:"not null" json:"title"`
	Slug       string         `gorm:"unique;not null" json:"slug"`
	Content    string         `json:"content"`
	Excerpt    string         `json:"excerpt"`
	CoverImage string         `json:"cover_image"`
	Category   string         `json:"category"`
	Tags       pq.StringArray `gorm:"type:text[]" json:"tags"`
	Status     string         `gorm:"default:'draft'" json:"status"`
	Views      int            `gorm:"default:0" json:"views"`
	IsFeatured bool           `gorm:"default:false" json:"is_featured"`
	LocationName string       `json:"location_name"`
	Latitude     float64      `json:"latitude"`
	Longitude    float64      `json:"longitude"`
	YoutubeURL   string       `json:"youtube_url"`
	AuthorID   uuid.UUID      `gorm:"type:uuid" json:"author_id"`
	WPID       int            `json:"wp_id"` // Store original WordPress ID to prevent duplicates
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	AuthorName string         `gorm:"-" json:"author"`        // For response
	CommentCount int64        `gorm:"-" json:"comment_count"` // For response
}

type Page struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Slug      string    `gorm:"unique;not null" json:"slug"`
	Content   string    `json:"content"`
	Excerpt   string    `json:"excerpt"`
	Status    string    `gorm:"default:'draft'" json:"status"`
	ShowInNav bool      `gorm:"default:false" json:"show_in_nav"`
	NavOrder  int       `gorm:"default:0" json:"nav_order"`
	CreatedBy uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SiteSettings struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SiteName        string    `gorm:"default:'BlogUstad'" json:"site_name"`
	Tagline             string    `json:"tagline"`
	SiteDescription     string    `json:"site_description"`
	LogoURL             string    `json:"logo_url"`
	FaviconURL          string    `json:"favicon_url"`
	FooterText          string    `json:"footer_text"`
	HomepageVersion     string    `gorm:"default:'v1'" json:"homepage_version"`
	ScrollToTopVersion  string    `gorm:"default:'animated'" json:"scroll_to_top_version"`
	AdminToken          string    `gorm:"default:'090124'" json:"admin_token"`
	SliderStyle         string    `gorm:"default:'v2'" json:"slider_style"`
	NewsletterTitle     string    `json:"newsletter_title"`
	NewsletterDescription string  `json:"newsletter_description"`
	NewsletterButtonText string   `json:"newsletter_button_text"`
	NewsletterLink       string   `json:"newsletter_link"`
	AdminSlug           string    `gorm:"default:'yaakhi'" json:"admin_slug"`
	HeroTitle           string    `gorm:"default:'Editors Choice'" json:"hero_title"`
	RecentTitle         string    `gorm:"default:'Recent Stories'" json:"recent_title"`
	ThemeColor          string    `gorm:"default:'emerald'" json:"theme_color"`
	AboutHeroImage      string    `json:"about_hero_image"`
	AboutVisionImage1   string    `json:"about_vision_image_1"`
	AboutVisionImage2   string    `json:"about_vision_image_2"`
	AboutValue1Title    string    `json:"about_value_1_title"`
	AboutValue1Desc     string    `json:"about_value_1_desc"`
	AboutValue2Title    string    `json:"about_value_2_title"`
	AboutValue2Desc     string    `json:"about_value_2_desc"`
	AboutValue3Title    string    `json:"about_value_3_title"`
	AboutValue3Desc     string    `json:"about_value_3_desc"`
	AboutContactEmail   string    `json:"about_contact_email"`
	AboutContactPhone   string    `json:"about_contact_phone"`
	AboutFooterQuote    string    `json:"about_footer_quote"`
	AboutFooterAuthor   string    `json:"about_footer_author"`
	GoogleAnalyticsID   string    `json:"google_analytics_id"`
	CategoriesTitle     string    `json:"categories_title"`
	CategoriesSubtitle  string    `json:"categories_subtitle"`
	UpdatedBy           uuid.UUID `gorm:"type:uuid" json:"updated_by"`
	UpdatedAt           time.Time `json:"updated_at"`
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
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ArticleID uuid.UUID `gorm:"type:uuid;not null" json:"article_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Content   string    `gorm:"not null" json:"content"`
	ParentID  *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DisplayName string  `gorm:"-" json:"display_name"`
	Initials    string  `gorm:"-" json:"initials"`
	ArticleTitle string `gorm:"-" json:"article_title"`
}

type Transaction struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"` // topup, payment
	Status    string    `gorm:"default:'pending'" json:"status"` // pending, success, failed
	Reference string    `json:"reference"` // description or course title
	ProofURL  string    `json:"proof_url"`
	CreatedAt time.Time `json:"created_at"`
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
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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

type Enrollment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null" json:"course_id"`
	Status    string    `gorm:"default:'pending'" json:"status"` // pending, active
	CreatedAt time.Time `json:"created_at"`
}

type NavItem struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Label     string    `json:"label"`
	URL       string    `json:"url"`
	SortOrder int       `json:"sort_order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
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
