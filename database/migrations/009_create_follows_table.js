/**
 * Migration: Create Follows Table
 * User follow relationships
 */

exports.up = (pgm) => {
  // Create follows table
  pgm.createTable('follows', {
    follower_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    following_id: {
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

  // Add composite primary key
  pgm.addConstraint('follows', 'follows_pkey', {
    primaryKey: ['follower_id', 'following_id']
  });

  // Add CHECK constraint to prevent self-follows
  pgm.addConstraint('follows', 'follows_no_self_follow', {
    check: 'follower_id != following_id'
  });

  // Create indexes
  pgm.createIndex('follows', 'follower_id');
  pgm.createIndex('follows', 'following_id');
};

exports.down = (pgm) => {
  pgm.dropTable('follows');
};