-- Migration: Enable PostgreSQL extensions
-- Required extensions for the application
-- Created: 2026-01-08

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text extension (useful for email comparisons)
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
