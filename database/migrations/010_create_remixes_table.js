/**
 * Migration: Create Remixes Table
 * Tracks remix relationships between content
 */

exports.up = (pgm) => {
  // Create remixes table
  pgm.createTable('remixes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    original_content_id: {
      type: 'uuid',
      notNull: true,
      references: 'content(id)',
      onDelete: 'CASCADE'
    },
    remix_content_id: {
      type: 'uuid',
      notNull: true,
      references: 'content(id)',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Add unique constraint to prevent duplicate remix records
  pgm.addConstraint('remixes', 'remixes_unique', {
    unique: ['original_content_id', 'remix_content_id']
  });

  // Add CHECK constraint to prevent self-remixes
  pgm.addConstraint('remixes', 'remixes_no_self_remix', {
    check: 'original_content_id != remix_content_id'
  });

  // Create indexes
  pgm.createIndex('remixes', 'original_content_id');
  pgm.createIndex('remixes', 'remix_content_id');

  // Create trigger function to update content.remix_count
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_content_remix_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE content SET remix_count = remix_count + 1 WHERE id = NEW.original_content_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE content SET remix_count = remix_count - 1 WHERE id = OLD.original_content_id;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger
  pgm.sql(`
    CREATE TRIGGER remixes_count_trigger
    AFTER INSERT OR DELETE ON remixes
    FOR EACH ROW EXECUTE FUNCTION update_content_remix_count();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS remixes_count_trigger ON remixes;');
  pgm.sql('DROP FUNCTION IF EXISTS update_content_remix_count();');
  pgm.dropTable('remixes');
};