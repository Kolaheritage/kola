const db = require('../config/database');

/**
 * Content Model
 * Handles database operations for content posts
 * HER-22: Create Content Endpoint
 */

class Content {
  /**
   * Find all content (with optional filters)
   * @param {Object} filters - Optional filters (category_id, user_id, status, limit, offset, sort)
   * @returns {Promise<Array>} - Array of content posts
   */
  static async findAll(filters = {}) {
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
    const params = [];
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
  static async findById(id) {
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
  static async create(contentData) {
    const {
      title,
      description,
      category_id,
      user_id,
      media_url,
      thumbnail_url,
      tags,
      status = 'published'
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
      status
    ]);

    // Fetch the complete content with joined data
    return await this.findById(result.rows[0].id);
  }

  /**
   * Update content post
   * @param {string} id - Content UUID
   * @param {Object} contentData - Updated content data
   * @returns {Promise<Object>} - Updated content post
   */
  static async update(id, contentData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Only update allowed fields
    const allowedFields = ['title', 'description', 'category_id', 'media_url', 'thumbnail_url', 'tags', 'status'];

    Object.keys(contentData).forEach(key => {
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
    return await this.findById(result.rows[0].id);
  }

  /**
   * Delete content post
   * @param {string} id - Content UUID
   * @returns {Promise<Object>} - Deleted content post
   */
  static async delete(id) {
    const query = 'DELETE FROM content WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Count content posts (with optional filters)
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} - Count of content posts
   */
  static async count(filters = {}) {
    const { category_id, user_id, status } = filters;

    let query = 'SELECT COUNT(*) as count FROM content WHERE 1=1';
    const params = [];
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
  static async findByTags(tags) {
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
  static async incrementViewCount(id) {
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
  static async incrementLikes(id) {
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
  static async decrementLikes(id) {
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
  static async getRandomByCategory(categoryId, status = 'published') {
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
  static async getRandomPerCategory(status = 'published') {
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
}

module.exports = Content;
