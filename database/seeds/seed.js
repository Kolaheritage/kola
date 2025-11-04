/**
 * Seed Script for Heritage Platform
 * Seeds initial categories and sample tags
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

const categories = [
  {
    name: 'Rituals',
    slug: 'rituals',
    description: 'Traditional ceremonies, rituals, and spiritual practices',
    icon: '🕯️',
    display_order: 1
  },
  {
    name: 'Dance',
    slug: 'dance',
    description: 'Traditional and contemporary dances from various cultures',
    icon: '💃',
    display_order: 2
  },
  {
    name: 'Music',
    slug: 'music',
    description: 'Musical performances, compositions, and instruments',
    icon: '🎵',
    display_order: 3
  },
  {
    name: 'Recipes',
    slug: 'recipes',
    description: 'Traditional recipes and cooking methods passed down through generations',
    icon: '🍲',
    display_order: 4
  },
  {
    name: 'Stories',
    slug: 'stories',
    description: 'Oral histories, folklore, and cultural stories',
    icon: '📖',
    display_order: 5
  },
  {
    name: 'Crafts',
    slug: 'crafts',
    description: 'Traditional crafts, handiwork, and artisan skills',
    icon: '🎨',
    display_order: 6
  }
];

const tags = [
  // General tags
  { name: 'traditional', category_id: null },
  { name: 'contemporary', category_id: null },
  { name: 'festive', category_id: null },
  { name: 'educational', category_id: null },
  { name: 'family', category_id: null },
  
  // Rituals tags
  { name: 'ceremonial', category_id: 1 },
  { name: 'wedding', category_id: 1 },
  { name: 'spiritual', category_id: 1 },
  { name: 'coming-of-age', category_id: 1 },
  
  // Dance tags
  { name: 'folk-dance', category_id: 2 },
  { name: 'modern-dance', category_id: 2 },
  { name: 'group-dance', category_id: 2 },
  { name: 'solo-performance', category_id: 2 },
  
  // Music tags
  { name: 'guitar', category_id: 3 },
  { name: 'drums', category_id: 3 },
  { name: 'vocals', category_id: 3 },
  { name: 'instrumental', category_id: 3 },
  { name: 'choral', category_id: 3 },
  
  // Recipes tags
  { name: 'vegetarian', category_id: 4 },
  { name: 'vegan', category_id: 4 },
  { name: 'dessert', category_id: 4 },
  { name: 'main-course', category_id: 4 },
  { name: 'appetizer', category_id: 4 },
  { name: 'street-food', category_id: 4 },
  
  // Stories tags
  { name: 'legend', category_id: 5 },
  { name: 'folklore', category_id: 5 },
  { name: 'oral-history', category_id: 5 },
  { name: 'creation-story', category_id: 5 },
  
  // Crafts tags
  { name: 'pottery', category_id: 6 },
  { name: 'weaving', category_id: 6 },
  { name: 'woodwork', category_id: 6 },
  { name: 'jewelry', category_id: 6 },
  { name: 'textile', category_id: 6 }
];

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Start transaction
    await client.query('BEGIN');

    // Seed categories
    console.log('📂 Seeding categories...');
    for (const category of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, slug, description, icon, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [category.name, category.slug, category.description, category.icon, category.display_order]
      );
      
      if (result.rows.length > 0) {
        console.log(`  ✓ Created category: ${category.name} (${category.icon})`);
      } else {
        console.log(`  ⚠ Category already exists: ${category.name}`);
      }
    }

    // Get category IDs for tags
    const categoryMap = {};
    const categoryResult = await client.query('SELECT id, name FROM categories');
    categoryResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // Seed tags
    console.log('\n🏷️  Seeding tags...');
    for (const tag of tags) {
      // Map category_id from name to actual ID
      let categoryId = tag.category_id;
      if (categoryId) {
        const categoryName = categories[categoryId - 1].name;
        categoryId = categoryMap[categoryName];
      }

      const result = await client.query(
        `INSERT INTO tags (name, category_id)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [tag.name, categoryId]
      );
      
      if (result.rows.length > 0) {
        console.log(`  ✓ Created tag: ${tag.name}`);
      } else {
        console.log(`  ⚠ Tag already exists: ${tag.name}`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${tags.length} tags`);

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seed().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});