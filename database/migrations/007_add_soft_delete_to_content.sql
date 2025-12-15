-- Migration: Add soft delete to content table
-- HER-52: Delete Content
-- Adds deleted_at timestamp for soft delete functionality

ALTER TABLE content
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_content_deleted_at ON content(deleted_at);

-- Add comment
COMMENT ON COLUMN content.deleted_at IS 'Timestamp when content was soft deleted. NULL means not deleted.';
