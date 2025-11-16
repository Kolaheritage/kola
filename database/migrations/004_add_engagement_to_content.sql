-- Migration: Add engagement metrics to content table
-- HER-23: Get Content by Category Endpoint
-- Created: 2025-11-16

ALTER TABLE content
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Create index on view_count for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_content_view_count ON content(view_count DESC);

-- Create index on likes for sorting by most liked
CREATE INDEX IF NOT EXISTS idx_content_likes ON content(likes DESC);

-- Note: These columns track user engagement with content
-- view_count: Incremented when content is viewed
-- likes: Incremented when users like the content
