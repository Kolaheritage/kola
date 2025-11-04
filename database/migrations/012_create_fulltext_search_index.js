/**
 * Migration: Create Full-Text Search Index
 * Creates GIN index for searching content by title and description
 */

exports.up = (pgm) => {
  // Create full-text search index
  pgm.sql(`
    CREATE INDEX content_search_idx ON content 
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS content_search_idx;');
};