/**
 * Migration: Create Comments Table
 * User comments on content with trigger to update comment_count
 */

exports.up = (pgm) => {
  // Create comments table
  pgm.createTable('comments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    content_id: {
      type: 'uuid',
      notNull: true,
      references: 'content(id)',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    comment_text: {
      type: 'text',
      notNull: true
    },
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Create indexes
  pgm.createIndex('comments', 'content_id');
  pgm.createIndex('comments', 'user_id');
  pgm.createIndex('comments', 'created_at');
  pgm.createIndex('comments', ['content_id', 'created_at'], {
    name: 'comments_content_recent_idx'
  });

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create trigger function to update content.comment_count
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_content_comment_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE content SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE content SET comment_count = comment_count - 1 WHERE id = OLD.content_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger
  pgm.sql(`
    CREATE TRIGGER comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_content_comment_count();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS comments_count_trigger ON comments;');
  pgm.sql('DROP FUNCTION IF EXISTS update_content_comment_count();');
  pgm.dropTable('comments');
};