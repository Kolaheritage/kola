import db from '../config/database';

/**
 * Content Model
 * Handles database operations for content posts
 */

export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentSort = 'recent' | 'popular' | 'most_liked' | 'oldest';

export interface ContentData {
  id?: string;
  title: string;
  description?: string;
  category_id: string;
  user_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status: ContentStatus;
  view_count?: number;
  likes?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ContentWithDetails extends ContentData {
  username?: string;
  user_avatar?: string;
  user_email?: string;
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
}

export interface CreateContentData {
  title: string;
  description?: string;
  category_id: string;
  user_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: ContentStatus;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  category_id?: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: ContentStatus;
  [key: string]: any;
}

export interface ContentFilters {
  category_id?: string;
  user_id?: string;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
  sort?: ContentSort;
}

export interface SearchFilters {
  query: string;
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

export interface SearchResult extends ContentWithDetails {
  rank?: number;
  headline_title?: string;
  headline_description?: string;
}

class Content {
  /**
   * Search content using PostgreSQL full-text search
   * HER-44: Search Functionality
   * @param {SearchFilters} filters - Search filters including query, status, limit, offset
   * @returns {Promise<{ results: SearchResult[]; total: number }>} - Search results with count
   */
  static async search(filters: SearchFilters): Promise<{ results: SearchResult[]; total: number }> {
    const { query, status = 'published', limit = 20, offset = 0 } = filters;

    // Sanitize search query for PostgreSQL tsquery
    const sanitizedQuery = query
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word.replace(/[^\w]/g, ''))
      .filter((word) => word.length > 0)
      .join(' | '); // OR search

    if (!sanitizedQuery) {
      return { results: [], total: 0 };
    }

    // Full-text search query with ranking
    // Searches in title (weight A), description (weight B), and tags (weight C)
    const searchQuery = `
      WITH search_results AS (
        SELECT
          c.*,
          u.username, u.avatar_url as user_avatar,
          cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon,
          ts_rank(
            setweight(to_tsvector('english', COALESCE(c.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(c.description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(array_to_string(c.tags, ' '), '')), 'C'),
            to_tsquery('english', $1)
          ) as rank,
          ts_headline('english', c.title, to_tsquery('english', $1),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10') as headline_title,
          ts_headline('english', COALESCE(c.description, ''), to_tsquery('english', $1),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10') as headline_description
        FROM content c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.status = $2
          AND (
            to_tsvector('english', COALESCE(c.title, '')) ||
            to_tsvector('english', COALESCE(c.description, '')) ||
            to_tsvector('english', COALESCE(array_to_string(c.tags, ' '), ''))
          ) @@ to_tsquery('english', $1)
      )
      SELECT * FROM search_results
      ORDER BY rank DESC, created_at DESC
      LIMIT $3 OFFSET $4
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM content c
      WHERE c.status = $2
        AND (
          to_tsvector('english', COALESCE(c.title, '')) ||
          to_tsvector('english', COALESCE(c.description, '')) ||
          to_tsvector('english', COALESCE(array_to_string(c.tags, ' '), ''))
        ) @@ to_tsquery('english', $1)
    `;

    const [resultsResult, countResult] = await Promise.all([
      db.query(searchQuery, [sanitizedQuery, status, limit, offset]),
      db.query(countQuery, [sanitizedQuery, status]),
    ]);

    return {
      results: resultsResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
    };
  }

  /**
   * Find all content (with optional filters)
   * @param {Object} filters - Optional filters (category_id, user_id, status, limit, offset, sort)
   * @returns {Promise<Array>} - Array of content posts
   */
  static async findAll(filters: ContentFilters = {}): Promise<ContentWithDetails[]> {
    const { category_id, user_id, status, limit = 20, offset = 0, sort = 'recent' } = filters;

    let query = `
      SELECT
        c.*,
        u.username, u.avatar_url as user_avatar,
        cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon
      FROM content c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (user_id) {
      query += ` AND c.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Add sorting
    let orderBy = 'c.created_at DESC'; // Default: recent
    if (sort === 'popular') {
      orderBy = 'c.view_count DESC, c.created_at DESC';
    } else if (sort === 'most_liked') {
      orderBy = 'c.likes DESC, c.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    }

    query += ` ORDER BY ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Find content by ID
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Content post with user and category details
   */
  static async findById(id: string): Promise<ContentWithDetails | undefined> {
    const query = `
      SELECT
        c.*,
        u.username, u.avatar_url as user_avatar, u.email as user_email,
        cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon
      FROM content c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Create new content post
   * @param {Object} contentData - Content data
   * @returns {Promise<Object>} - Created content post
   */
  static async create(contentData: CreateContentData): Promise<ContentWithDetails> {
    const {
      title,
      description,
      category_id,
      user_id,
      media_url,
      thumbnail_url,
      tags,
      status = 'published',
    } = contentData;

    const query = `
      INSERT INTO content (
        title, description, category_id, user_id,
        media_url, thumbnail_url, tags, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      description,
      category_id,
      user_id,
      media_url,
      thumbnail_url,
      tags,
      status,
    ]);

    // Fetch the complete content with joined data
    const created = await this.findById(result.rows[0].id);
    return created!;
  }

  /**
   * Update content post
   * @param {string} id - Content UUID
   * @param {Object} contentData - Updated content data
   * @returns {Promise<Object>} - Updated content post
   */
  static async update(
    id: string,
    contentData: UpdateContentData
  ): Promise<ContentWithDetails | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Only update allowed fields
    const allowedFields = [
      'title',
      'description',
      'category_id',
      'media_url',
      'thumbnail_url',
      'tags',
      'status',
    ];

    Object.keys(contentData).forEach((key) => {
      if (allowedFields.includes(key) && contentData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(contentData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE content
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    // Fetch the complete content with joined data
    return (await this.findById(result.rows[0].id)) || null;
  }

  /**
   * Delete content post
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Deleted content post
   */
  static async delete(id: string): Promise<ContentData | undefined> {
    const query = 'DELETE FROM content WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Count content posts (with optional filters)
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} - Count of content posts
   */
  static async count(filters: ContentFilters = {}): Promise<number> {
    const { category_id, user_id, status } = filters;

    let query = 'SELECT COUNT(*) as count FROM content WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Search content by tags
   * @param {Array} tags - Array of tags to search
   * @returns {Promise<Array>} - Array of content posts
   */
  static async findByTags(tags: string[]): Promise<ContentWithDetails[]> {
    const query = `
      SELECT
        c.*,
        u.username, u.avatar_url as user_avatar,
        cat.name as category_name, cat.slug as category_slug
      FROM content c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.tags && $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [tags]);
    return result.rows;
  }

  /**
   * Increment view count for a content post
   * HER-23: Track content views
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Updated content post
   */
  static async incrementViewCount(id: string): Promise<{ view_count: number } | undefined> {
    const query = `
      UPDATE content
      SET view_count = view_count + 1
      WHERE id = $1
      RETURNING view_count
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Increment likes for a content post
   * HER-23: Track content likes
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Updated content post
   */
  static async incrementLikes(id: string): Promise<{ likes: number } | undefined> {
    const query = `
      UPDATE content
      SET likes = likes + 1
      WHERE id = $1
      RETURNING likes
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Decrement likes for a content post
   * HER-23: Track content likes
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Updated content post
   */
  static async decrementLikes(id: string): Promise<{ likes: number } | undefined> {
    const query = `
      UPDATE content
      SET likes = GREATEST(likes - 1, 0)
      WHERE id = $1
      RETURNING likes
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get random content from a specific category
   * HER-24: Get Random Content for Home Page
   * @param {string} categoryId - Category UUID
   * @param {string} status - Content status (default: 'published')
   * @returns {Promise<Object>} - Random content item
   */
  static async getRandomByCategory(
    categoryId: string,
    status: ContentStatus = 'published'
  ): Promise<ContentWithDetails | undefined> {
    const query = `
      SELECT
        c.*,
        u.username, u.avatar_url as user_avatar,
        cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon
      FROM content c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.category_id = $1 AND c.status = $2
      ORDER BY RANDOM()
      LIMIT 1
    `;
    const result = await db.query(query, [categoryId, status]);
    return result.rows[0];
  }

  /**
   * Get one random content item per category
   * HER-24: Get Random Content for Home Page
   * @param {string} status - Content status (default: 'published')
   * @returns {Promise<Array>} - Array of random content items (one per category)
   */
  static async getRandomPerCategory(
    status: ContentStatus = 'published'
  ): Promise<ContentWithDetails[]> {
    // Use DISTINCT ON to get one random item per category
    // First get all categories, then get one random item for each
    const query = `
      SELECT DISTINCT ON (cat.id)
        c.*,
        u.username, u.avatar_url as user_avatar,
        cat.id as category_id, cat.name as category_name,
        cat.slug as category_slug, cat.icon as category_icon
      FROM categories cat
      LEFT JOIN LATERAL (
        SELECT *
        FROM content
        WHERE category_id = cat.id AND status = $1
        ORDER BY RANDOM()
        LIMIT 1
      ) c ON true
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id IS NOT NULL
      ORDER BY cat.id, RANDOM()
    `;
    const result = await db.query(query, [status]);
    return result.rows;
  }

  /**
   * Get user statistics for dashboard
   * HER-50: User Dashboard Page
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} - User statistics
   */
  static async getUserStats(userId: string): Promise<{
    total_content: number;
    published_count: number;
    draft_count: number;
    total_views: number;
    total_likes: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_content,
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COALESCE(SUM(view_count), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes
      FROM content
      WHERE user_id = $1
    `;
    const result = await db.query(query, [userId]);

    return {
      total_content: parseInt(result.rows[0]?.total_content || '0'),
      published_count: parseInt(result.rows[0]?.published_count || '0'),
      draft_count: parseInt(result.rows[0]?.draft_count || '0'),
      total_views: parseInt(result.rows[0]?.total_views || '0'),
      total_likes: parseInt(result.rows[0]?.total_likes || '0'),
    };
  }
}

export default Content;
