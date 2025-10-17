const db = require('../config/database');

/**
 * User Model
 * Handles database operations for users
 * Will be fully implemented in HER-10
 */

class User {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { email, username, password_hash } = userData;
    const query = `
      INSERT INTO users (email, username, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email, username, created_at
    `;
    const result = await db.query(query, [email, username, password_hash]);
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(userData[key]);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, email, username, bio, avatar_url, updated_at
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = User;