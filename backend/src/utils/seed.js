require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

/**
 * Database Seed Script
 * HER-11: User Login Backend
 * Seeds the database with test data
 */

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'heritage_user',
  password: process.env.DB_PASSWORD || 'heritage_password',
  database: process.env.DB_NAME || 'heritage_db',
});

/**
 * Seed test users
 */
async function seedUsers() {
  console.log('👤 Seeding test users...');

  const testUsers = [
    {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test1234',
      bio: 'Test user for development'
    },
    {
      email: 'admin@example.com',
      username: 'admin',
      password: 'Admin1234',
      bio: 'Admin user for development'
    },
    {
      email: 'demo@example.com',
      username: 'demouser',
      password: 'Demo1234',
      bio: 'Demo user for testing'
    }
  ];

  for (const user of testUsers) {
    try {
      // Hash password
      const password_hash = await bcrypt.hash(user.password, 10);

      // Insert user (ignore if already exists)
      await pool.query(
        `INSERT INTO users (email, username, password_hash, bio)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.username, password_hash, user.bio]
      );

      console.log(`  ✅ Created user: ${user.email} (password: ${user.password})`);
    } catch (error) {
      console.error(`  ❌ Error creating user ${user.email}:`, error.message);
    }
  }
}

/**
 * Seed categories
 * HER-20: Categories Seed Data
 */
async function seedCategories() {
  console.log('📂 Seeding categories...');

  const categories = [
    {
      name: 'Rituals',
      slug: 'rituals',
      description: 'Traditional ceremonies, customs, and sacred practices passed down through generations',
      icon: '🕯️'
    },
    {
      name: 'Dance',
      slug: 'dance',
      description: 'Traditional and cultural dance forms, movements, and performances that tell our stories',
      icon: '💃'
    },
    {
      name: 'Music',
      slug: 'music',
      description: 'Traditional songs, instruments, rhythms, and musical heritage from our cultures',
      icon: '🎵'
    },
    {
      name: 'Recipes',
      slug: 'recipes',
      description: 'Traditional cooking methods, family recipes, and culinary heritage from our ancestors',
      icon: '🍲'
    },
    {
      name: 'Stories',
      slug: 'stories',
      description: 'Oral histories, legends, folktales, and narratives that preserve our cultural wisdom',
      icon: '📖'
    },
    {
      name: 'Crafts',
      slug: 'crafts',
      description: 'Traditional artisan skills, handicrafts, and artistic techniques from our heritage',
      icon: '🎨'
    }
  ];

  for (const category of categories) {
    try {
      // Insert category (ignore if already exists)
      await pool.query(
        `INSERT INTO categories (name, slug, description, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [category.name, category.slug, category.description, category.icon]
      );

      console.log(`  ✅ Created category: ${category.name} ${category.icon}`);
    } catch (error) {
      console.error(`  ❌ Error creating category ${category.name}:`, error.message);
    }
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed users
    await seedUsers();

    // Seed categories
    await seedCategories();

    // Add more seed functions here as needed
    // await seedContent();

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed if this script is executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed, seedUsers, seedCategories };
