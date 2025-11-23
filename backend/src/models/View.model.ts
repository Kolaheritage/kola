import db from '../config/database';

/**
 * View Model
 * HER-43: View Counter
 * Handles view tracking with session-based deduplication
 */

export interface ViewData {
  id?: string;
  content_id: string;
  user_id?: string | null;
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  viewed_at?: Date;
}

export interface ViewStats {
  total_views: number;
  unique_viewers: number;
  views_today: number;
  views_this_week: number;
}

// Time window for allowing re-views (24 hours in milliseconds)
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

class View {
  /**
   * Check if a view should be counted (not a duplicate within cooldown period)
   * @param contentId - Content UUID
   * @param userId - User UUID (for authenticated users)
   * @param sessionId - Session ID (for anonymous users)
   * @returns Promise<boolean> - true if view should be counted
   */
  static async shouldCountView(
    contentId: string,
    userId?: string | null,
    sessionId?: string | null
  ): Promise<boolean> {
    // Build query based on whether user is authenticated
    let query: string;
    let params: any[];

    if (userId) {
      // For authenticated users, check by user_id
      query = `
        SELECT id, viewed_at FROM content_views
        WHERE content_id = $1 AND user_id = $2
        ORDER BY viewed_at DESC
        LIMIT 1
      `;
      params = [contentId, userId];
    } else if (sessionId) {
      // For anonymous users, check by session_id
      query = `
        SELECT id, viewed_at FROM content_views
        WHERE content_id = $1 AND session_id = $2 AND user_id IS NULL
        ORDER BY viewed_at DESC
        LIMIT 1
      `;
      params = [contentId, sessionId];
    } else {
      // No tracking info available, don't count
      return false;
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      // No previous view, should count
      return true;
    }

    // Check if cooldown period has passed
    const lastView = new Date(result.rows[0].viewed_at);
    const now = new Date();
    const timeSinceLastView = now.getTime() - lastView.getTime();

    return timeSinceLastView >= VIEW_COOLDOWN_MS;
  }

  /**
   * Record a view and increment content view count if appropriate
   * @param viewData - View data to record
   * @returns Promise<{ counted: boolean; viewCount: number }> - Result of view recording
   */
  static async recordView(viewData: ViewData): Promise<{ counted: boolean; viewCount: number }> {
    const { content_id, user_id, session_id, ip_address, user_agent } = viewData;

    // Check if this view should be counted
    const shouldCount = await this.shouldCountView(content_id, user_id, session_id);

    if (!shouldCount) {
      // Get current view count without incrementing
      const countResult = await db.query('SELECT view_count FROM content WHERE id = $1', [
        content_id,
      ]);
      return {
        counted: false,
        viewCount: countResult.rows[0]?.view_count || 0,
      };
    }

    // Use a transaction to ensure consistency
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Insert or update the view record
      if (user_id) {
        // For authenticated users, upsert by user_id
        await client.query(
          `
          INSERT INTO content_views (content_id, user_id, session_id, ip_address, user_agent, viewed_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (content_id, COALESCE(user_id::text, session_id))
          DO UPDATE SET viewed_at = NOW(), ip_address = $4, user_agent = $5
        `,
          [content_id, user_id, session_id, ip_address, user_agent]
        );
      } else if (session_id) {
        // For anonymous users, upsert by session_id
        await client.query(
          `
          INSERT INTO content_views (content_id, user_id, session_id, ip_address, user_agent, viewed_at)
          VALUES ($1, NULL, $2, $3, $4, NOW())
          ON CONFLICT (content_id, COALESCE(user_id::text, session_id))
          DO UPDATE SET viewed_at = NOW(), ip_address = $3, user_agent = $4
        `,
          [content_id, session_id, ip_address, user_agent]
        );
      }

      // Increment the view count
      const updateResult = await client.query(
        `
        UPDATE content
        SET view_count = view_count + 1
        WHERE id = $1
        RETURNING view_count
      `,
        [content_id]
      );

      await client.query('COMMIT');

      return {
        counted: true,
        viewCount: updateResult.rows[0]?.view_count || 0,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get view statistics for a content
   * @param contentId - Content UUID
   * @returns Promise<ViewStats> - View statistics
   */
  static async getStats(contentId: string): Promise<ViewStats> {
    const query = `
      SELECT
        (SELECT view_count FROM content WHERE id = $1) as total_views,
        COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_viewers,
        COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '24 hours') as views_today,
        COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days') as views_this_week
      FROM content_views
      WHERE content_id = $1
    `;
    const result = await db.query(query, [contentId]);

    return {
      total_views: parseInt(result.rows[0]?.total_views || '0'),
      unique_viewers: parseInt(result.rows[0]?.unique_viewers || '0'),
      views_today: parseInt(result.rows[0]?.views_today || '0'),
      views_this_week: parseInt(result.rows[0]?.views_this_week || '0'),
    };
  }

  /**
   * Get recent viewers for a content
   * @param contentId - Content UUID
   * @param limit - Number of viewers to return
   * @returns Promise<ViewData[]> - Array of recent views
   */
  static async getRecentViewers(contentId: string, limit: number = 10): Promise<ViewData[]> {
    const query = `
      SELECT cv.*, u.username, u.avatar_url as user_avatar
      FROM content_views cv
      LEFT JOIN users u ON cv.user_id = u.id
      WHERE cv.content_id = $1
      ORDER BY cv.viewed_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [contentId, limit]);
    return result.rows;
  }

  /**
   * Clean up old view records (optional maintenance)
   * @param olderThanDays - Delete records older than this many days
   * @returns Promise<number> - Number of deleted records
   */
  static async cleanup(olderThanDays: number = 90): Promise<number> {
    const query = `
      DELETE FROM content_views
      WHERE viewed_at < NOW() - INTERVAL '1 day' * $1
      RETURNING id
    `;
    const result = await db.query(query, [olderThanDays]);
    return result.rows.length;
  }
}

export default View;
