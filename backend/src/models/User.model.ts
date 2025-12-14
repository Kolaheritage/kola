import db from '../config/database';

/**
 * User Model
 * Handles database operations for users
 */

export interface UserData {
  id?: string;
  email: string;
  username: string;
  password_hash: string;
  bio?: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  password_hash: string;
}

export interface UpdateUserData {
  username?: string;
  bio?: string;
  avatar_url?: string;
  [key: string]: any;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at?: Date;
}

class User {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserData | undefined> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<UserData | undefined> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Create new user
   */
  static async create(userData: CreateUserData): Promise<UserResponse> {
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
  static async update(id: string, userData: UpdateUserData): Promise<UserResponse | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(userData).forEach((key) => {
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

export default User;
