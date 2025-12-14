-- Migration: Create content_views table for view tracking
-- HER-43: View Counter
-- Created: 2025-11-23

-- Create content_views table to track unique views
-- This prevents duplicate view counts from the same user/session
CREATE TABLE IF NOT EXISTS content_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Create unique constraint using partial indexes
-- For authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_user
    ON content_views(content_id, user_id)
    WHERE user_id IS NOT NULL;

-- For anonymous users
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_session
    ON content_views(content_id, session_id)
    WHERE user_id IS NULL AND session_id IS NOT NULL;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_views_content_id ON content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON content_views(user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_session_id ON content_views(session_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views(viewed_at DESC);

-- Note: View tracking strategy:
-- 1. For authenticated users: track by user_id
-- 2. For anonymous users: track by session_id (from cookie)
-- 3. Increment content.view_count only for new unique views
-- 4. Allow re-counting after 24 hours (can be adjusted)
