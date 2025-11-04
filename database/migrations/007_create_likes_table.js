/**
 * Migration: Create Likes Table
 * User likes on content with trigger to update like_count
 */

exports.up = (pgm) => {
  // Create likes table
  pgm.createTable('likes', {
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
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Add unique constraint to prevent duplicate likes
  pgm.addConstraint('likes', 'likes_content_user_unique', {
    unique: ['content_id', 'user_id']
  });

  // Create indexes
  pgm.createIndex('likes', 'content_id');
  pgm.createIndex('likes', 'user_id');
  pgm.createIndex('likes', ['content_id', 'user_id'], {
    name: 'likes_content_user_idx'
  });

  // Create trigger function to update content.like_count
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_content_like_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE content SET like_count = like_count + 1 WHERE id = NEW.content_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE content SET like_count = like_count - 1 WHERE id = OLD.content_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger
  pgm.sql(`
    CREATE TRIGGER likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_content_like_count();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS likes_count_trigger ON likes;');
  pgm.sql('DROP FUNCTION IF EXISTS update_content_like_count();');
  pgm.dropTable('likes');
};