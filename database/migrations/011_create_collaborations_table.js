/**
 * Migration: Create Collaborations Table
 * Tracks collaborators on content
 */

exports.up = (pgm) => {
  // Create collaborations table
  pgm.createTable('collaborations', {
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
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'collaborator'
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending'
    },
    invited_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()')
    },
    accepted_at: {
      type: 'timestamp with time zone',
      notNull: false
    }
  });

  // Add unique constraint to prevent duplicate collaborations
  pgm.addConstraint('collaborations', 'collaborations_unique', {
    unique: ['content_id', 'user_id']
  });

  // Add CHECK constraints
  pgm.addConstraint('collaborations', 'collaborations_status_check', {
    check: "status IN ('pending', 'accepted', 'rejected')"
  });

  pgm.addConstraint('collaborations', 'collaborations_role_check', {
    check: "role IN ('collaborator', 'elder', 'contributor')"
  });

  // Create indexes
  pgm.createIndex('collaborations', 'content_id');
  pgm.createIndex('collaborations', 'user_id');
  pgm.createIndex('collaborations', ['content_id', 'status'], {
    name: 'collaborations_content_status_idx'
  });
};

exports.down = (pgm) => {
  pgm.dropTable('collaborations');
};