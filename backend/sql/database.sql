-- Jalankan skrip ini di PostgreSQL Laragon (db: blogs)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum (dalam Postgres kita bisa pakai VARCHAR dengan check constraint agar fleksibel)
-- CREATE TYPE app_role AS ENUM ('admin', 'kontributor', 'pembaca');

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL, -- Di sistem lokal, kita bisa samakan id dengan user_id
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'pembaca' -- 'admin', 'kontributor', 'pembaca'
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT 'bg-primary/10 text-primary',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    cover_image TEXT,
    category TEXT,
    tags TEXT[], -- Postgres supports arrays
    status TEXT DEFAULT 'draft',
    views INT DEFAULT 0,
    author_id UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    show_in_nav BOOLEAN DEFAULT false,
    nav_order INT DEFAULT 0,
    created_by UUID REFERENCES profiles(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT DEFAULT 'BlogUstad',
    tagline TEXT,
    logo_url TEXT,
    footer_text TEXT,
    updated_by UUID REFERENCES profiles(user_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Init default site settings
INSERT INTO site_settings (site_name, tagline, footer_text) 
VALUES ('BlogUstad', 'Berbagi ilmu agama Islam untuk umat', 'Berbagi ilmu agama Islam untuk umat — © 2026');
