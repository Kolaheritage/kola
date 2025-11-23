-- Migration: Create likes table
-- HER-42: Like/Unlike Content
-- Created: 2025-11-23

-- Create likes table to track user-content like relationships
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure each user can only like a content once
    UNIQUE(user_id, content_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON likes(content_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_content ON likes(user_id, content_id);

-- Note: When a user likes content:
-- 1. Insert into likes table
-- 2. Increment content.likes count
-- When a user unlikes content:
-- 1. Delete from likes table
-- 2. Decrement content.likes count
