/**
 * Migration: Create Content Table
 * Stores user-generated content (videos, images, audio)
 */

exports.up = (pgm) => {
  pgm.createTable('content', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    category_id: {
      type: 'integer',
      notNull: true,
      references: 'categories(id)'
    },
    title: {
      type: 'varchar(200)',
      notNull: true
    },
    description: {
      type: 'text',
      notNull: false
    },
    media_url: {
      type: 'varchar(500)',
      notNull: true
    },
    media_type: {
      type: 'varchar(50)',
      notNull: true
    },
    thumbnail_url: {
      type: 'varchar(500)',
      notNull: false
    },
    duration: {
      type: 'integer',
      notNull: false,
      comment: 'Duration in seconds for video/audio'
    },
    file_size: {
      type: 'integer',
      notNull: false,
      comment: 'File size in bytes'
    },
    view_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    like_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    comment_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    remix_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'published'
    },
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    location: {
      type: 'varchar(255)',
      notNull: false
    },
    language: {
      type: 'varchar(50)',
      notNull: false
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

  // Add CHECK constraints
  pgm.addConstraint('content', 'content_status_check', {
    check: "status IN ('draft', 'published', 'archived')"
  });
  
  pgm.addConstraint('content', 'content_view_count_check', {
    check: 'view_count >= 0'
  });
  
  pgm.addConstraint('content', 'content_like_count_check', {
    check: 'like_count >= 0'
  });
  
  pgm.addConstraint('content', 'content_comment_count_check', {
    check: 'comment_count >= 0'
  });
  
  pgm.addConstraint('content', 'content_remix_count_check', {
    check: 'remix_count >= 0'
  });

  // Create indexes
  pgm.createIndex('content', 'user_id');
  pgm.createIndex('content', 'category_id');
  pgm.createIndex('content', 'created_at', { method: 'btree', order: 'DESC' });
  pgm.createIndex('content', 'view_count', { method: 'btree', order: 'DESC' });
  pgm.createIndex('content', 'like_count', { method: 'btree', order: 'DESC' });
  pgm.createIndex('content', 'status');
  pgm.createIndex('content', 'is_deleted');
  
  // Composite indexes for common queries
  pgm.createIndex('content', ['category_id', 'created_at'], { 
    method: 'btree',
    name: 'content_category_recent_idx'
  });
  
  pgm.createIndex('content', ['user_id', 'created_at'], { 
    method: 'btree',
    name: 'content_user_recent_idx'
  });

  // Partial indexes for common filters
  pgm.sql(`
    CREATE INDEX content_published_idx ON content(created_at DESC) 
    WHERE status = 'published' AND is_deleted = FALSE;
  `);

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_content_updated_at 
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('content');
};