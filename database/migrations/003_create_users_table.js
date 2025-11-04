/**
 * Migration: Create Users Table
 * Stores user accounts and profiles
 */

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    username: {
      type: 'varchar(50)',
      notNull: true,
      unique: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    avatar_url: {
      type: 'varchar(500)',
      notNull: false
    },
    bio: {
      type: 'text',
      notNull: false
    },
    cultural_background: {
      type: 'varchar(255)',
      notNull: false
    },
    is_elder: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    email_verified: {
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
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'username');
  pgm.createIndex('users', 'created_at');

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};