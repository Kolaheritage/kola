/**
 * Migration: Create Categories Table
 * Stores predefined content categories
 */

exports.up = (pgm) => {
  pgm.createTable('categories', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
      unique: true
    },
    slug: {
      type: 'varchar(100)',
      notNull: true,
      unique: true
    },
    description: {
      type: 'text',
      notNull: false
    },
    icon: {
      type: 'varchar(50)',
      notNull: false
    },
    display_order: {
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

  // Create indexes
  pgm.createIndex('categories', 'name');
  pgm.createIndex('categories', 'slug');
  pgm.createIndex('categories', 'display_order');
};

exports.down = (pgm) => {
  pgm.dropTable('categories');
};