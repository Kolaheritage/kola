import db from '../config/database';

/**
 * Like Model
 * HER-42: Like/Unlike Content
 * Handles database operations for content likes
 */

export interface LikeData {
  id?: string;
  user_id: string;
  content_id: string;
  created_at?: Date;
}

export interface LikeWithDetails extends LikeData {
  username?: string;
  user_avatar?: string;
  content_title?: string;
}

class Like {
  /**
   * Check if a user has liked a specific content
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @returns Promise<boolean> - true if liked, false otherwise
   */
  static async hasUserLiked(userId: string, contentId: string): Promise<boolean> {
    const query = `
      SELECT id FROM likes
      WHERE user_id = $1 AND content_id = $2
    `;
    const result = await db.query(query, [userId, contentId]);
    return result.rows.length > 0;
  }

  /**
   * Get like by user and content
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @returns Promise<LikeData | undefined>
   */
  static async findByUserAndContent(userId: string, contentId: string): Promise<LikeData | undefined> {
    const query = `
      SELECT * FROM likes
      WHERE user_id = $1 AND content_id = $2
    `;
    const result = await db.query(query, [userId, contentId]);
    return result.rows[0];
  }

  /**
   * Create a new like
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @returns Promise<LikeData> - Created like record
   */
  static async create(userId: string, contentId: string): Promise<LikeData> {
    const query = `
      INSERT INTO likes (user_id, content_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [userId, contentId]);
    return result.rows[0];
  }

  /**
   * Delete a like
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @returns Promise<boolean> - true if deleted, false if not found
   */
  static async delete(userId: string, contentId: string): Promise<boolean> {
    const query = `
      DELETE FROM likes
      WHERE user_id = $1 AND content_id = $2
      RETURNING id
    `;
    const result = await db.query(query, [userId, contentId]);
    return result.rows.length > 0;
  }

  /**
   * Get all likes for a content
   * @param contentId - Content UUID
   * @returns Promise<LikeWithDetails[]> - Array of likes with user details
   */
  static async findByContent(contentId: string): Promise<LikeWithDetails[]> {
    const query = `
      SELECT l.*, u.username, u.avatar_url as user_avatar
      FROM likes l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.content_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await db.query(query, [contentId]);
    return result.rows;
  }

  /**
   * Get all content liked by a user
   * @param userId - User UUID
   * @returns Promise<LikeWithDetails[]> - Array of likes with content details
   */
  static async findByUser(userId: string): Promise<LikeWithDetails[]> {
    const query = `
      SELECT l.*, c.title as content_title
      FROM likes l
      LEFT JOIN content c ON l.content_id = c.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Count likes for a content
   * @param contentId - Content UUID
   * @returns Promise<number> - Number of likes
   */
  static async countByContent(contentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM likes
      WHERE content_id = $1
    `;
    const result = await db.query(query, [contentId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Toggle like - creates if not exists, deletes if exists
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @returns Promise<{ liked: boolean; likeCount: number }> - Result of toggle operation
   */
  static async toggle(userId: string, contentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await this.findByUserAndContent(userId, contentId);

    if (existingLike) {
      // Unlike: delete the like and decrement count
      await this.delete(userId, contentId);
      await db.query(
        'UPDATE content SET likes = GREATEST(likes - 1, 0) WHERE id = $1',
        [contentId]
      );
    } else {
      // Like: create the like and increment count
      await this.create(userId, contentId);
      await db.query(
        'UPDATE content SET likes = likes + 1 WHERE id = $1',
        [contentId]
      );
    }

    // Get updated like count
    const countResult = await db.query(
      'SELECT likes FROM content WHERE id = $1',
      [contentId]
    );

    return {
      liked: !existingLike,
      likeCount: countResult.rows[0]?.likes || 0
    };
  }
}

export default Like;
