import db from '../config/database';

/**
 * Category Model
 * Handles database operations for categories
 * HER-20: Categories Seed Data
 */

export interface CategoryData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  [key: string]: any;
}

class Category {
  /**
   * Find all categories
   */
  static async findAll(): Promise<CategoryData[]> {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find category by ID
   */
  static async findById(id: string): Promise<CategoryData | undefined> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find category by slug
   */
  static async findBySlug(slug: string): Promise<CategoryData | undefined> {
    const query = 'SELECT * FROM categories WHERE slug = $1';
    const result = await db.query(query, [slug]);
    return result.rows[0];
  }

  /**
   * Create new category
   */
  static async create(categoryData: CreateCategoryData): Promise<CategoryData> {
    const { name, slug, description, icon } = categoryData;
    const query = `
      INSERT INTO categories (name, slug, description, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [name, slug, description, icon]);
    return result.rows[0];
  }

  /**
   * Update category
   */
  static async update(
    id: string,
    categoryData: UpdateCategoryData
  ): Promise<CategoryData | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(categoryData).forEach((key) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(categoryData[key]);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE categories
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete category
   */
  static async delete(id: string): Promise<CategoryData | undefined> {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

export default Category;
