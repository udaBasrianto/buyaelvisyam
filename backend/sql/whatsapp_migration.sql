-- WhatsApp Token table for verification
CREATE TABLE IF NOT EXISTS whatsapp_tokens (
    id VARCHAR(36) PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    token VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

-- WhatsApp Session table for storing client session
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id VARCHAR(36) PRIMARY KEY,
    jid VARCHAR(255),
    phone VARCHAR(20),
    name VARCHAR(255),
    connected BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_phone_number ON whatsapp_tokens(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_token ON whatsapp_tokens(token);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_verified_at ON whatsapp_tokens(verified_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_connected ON whatsapp_sessions(connected);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_jid ON whatsapp_sessions(jid);

-- Add WhatsApp columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(15) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;

-- Create indexes for WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_number ON profiles(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_verified ON profiles(whatsapp_verified);
