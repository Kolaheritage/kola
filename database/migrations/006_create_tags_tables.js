/**
 * Migration: Create Tags and Content_Tags Tables
 * Tags for content categorization and many-to-many relationship
 */

exports.up = (pgm) => {
  // Create tags table
  pgm.createTable('tags', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    name: {
      type: 'varchar(50)',
      notNull: true,
      unique: true
    },
    category_id: {
      type: 'integer',
      notNull: false,
      references: 'categories(id)',
      onDelete: 'SET NULL'
    },
    usage_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Create indexes on tags
  pgm.createIndex('tags', 'name');
  pgm.createIndex('tags', 'category_id');
  pgm.createIndex('tags', 'usage_count', { method: 'btree', order: 'DESC' });

  // Create content_tags junction table
  pgm.createTable('content_tags', {
    content_id: {
      type: 'uuid',
      notNull: true,
      references: 'content(id)',
      onDelete: 'CASCADE'
    },
    tag_id: {
      type: 'integer',
      notNull: true,
      references: 'tags(id)',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Add composite primary key
  pgm.addConstraint('content_tags', 'content_tags_pkey', {
    primaryKey: ['content_id', 'tag_id']
  });

  // Create index on tag_id for reverse lookups
  pgm.createIndex('content_tags', 'tag_id');
};

exports.down = (pgm) => {
  pgm.dropTable('content_tags');
  pgm.dropTable('tags');
};