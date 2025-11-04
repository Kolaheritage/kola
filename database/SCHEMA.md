# Heritage Platform - Database Schema Documentation

## Overview

PostgreSQL database with UUID primary keys, proper indexing, and referential integrity.

## Tables Summary

1. **users** - User accounts and profiles
2. **categories** - Content categories (Rituals, Dance, Music, etc.)
3. **content** - User-generated content posts
4. **tags** - Tags for categorizing content
5. **content_tags** - Many-to-many relationship between content and tags
6. **likes** - User likes on content
7. **comments** - User comments on content
8. **follows** - User follow relationships
9. **remixes** - Content remix relationships
10. **collaborations** - Content collaboration between users

---

## Table Definitions

### 1. users

Stores user account information and profiles.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    cultural_background VARCHAR(255),
    is_elder BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Primary key (UUID)
- `email` - User email (unique, required)
- `username` - Display name (unique, required, 3-50 chars)
- `password_hash` - Bcrypt hashed password
- `avatar_url` - Profile picture URL
- `bio` - User biography (max 1000 chars)
- `cultural_background` - User's cultural heritage
- `is_elder` - Flag for elder contributors (special badge)
- `email_verified` - Email verification status
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`
- Index on `created_at` for sorting

**Constraints:**
- Email must be unique and valid format
- Username must be 3-50 characters, alphanumeric + underscore
- Password hash required (validated in application)

---

### 2. categories

Predefined content categories.

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Primary key (auto-increment)
- `name` - Category name (e.g., "Rituals", "Dance")
- `slug` - URL-friendly version (e.g., "rituals", "dance")
- `description` - Category description
- `icon` - Emoji or icon identifier
- `display_order` - Order for displaying on homepage
- `created_at` - Creation timestamp

**Initial Categories:**
1. Rituals 🕯️
2. Dance 💃
3. Music 🎵
4. Recipes 🍲
5. Stories 📖
6. Crafts 🎨

**Indexes:**
- Primary key on `id`
- Unique index on `name`
- Unique index on `slug`
- Index on `display_order`

---

### 3. content

User-generated content (videos, images, audio).

```sql
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER,
    file_size INTEGER,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    remix_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    is_deleted BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    language VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Primary key (UUID)
- `user_id` - Creator's user ID (foreign key)
- `category_id` - Content category (foreign key)
- `title` - Content title (required, max 200 chars)
- `description` - Content description (max 5000 chars)
- `media_url` - URL to media file (video/image/audio)
- `media_type` - MIME type (video/mp4, image/jpeg, etc.)
- `thumbnail_url` - Preview thumbnail URL
- `duration` - Duration in seconds (for video/audio)
- `file_size` - File size in bytes
- `view_count` - Number of views (cached, denormalized)
- `like_count` - Number of likes (cached, denormalized)
- `comment_count` - Number of comments (cached, denormalized)
- `remix_count` - Number of remixes (cached, denormalized)
- `status` - Status: 'draft', 'published', 'archived'
- `is_deleted` - Soft delete flag
- `location` - Geographic location/region
- `language` - Content language/dialect
- `created_at` - Upload timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id` (for user's content)
- Index on `category_id` (for category pages)
- Index on `created_at DESC` (recent content)
- Index on `view_count DESC` (popular content)
- Index on `like_count DESC` (trending content)
- Composite index on `(category_id, created_at DESC)` (category + recent)
- Index on `status` (for filtering)
- Index on `is_deleted` (for filtering deleted content)
- Full-text search index on `(title, description)` using tsvector

**Constraints:**
- User must exist (foreign key)
- Category must exist (foreign key)
- Status must be one of: 'draft', 'published', 'archived'
- Media URL required
- Counts cannot be negative (CHECK constraint)

---

### 4. tags

Tags for additional content categorization.

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Primary key (auto-increment)
- `name` - Tag name (lowercase, unique)
- `category_id` - Optional category association
- `usage_count` - Number of times tag is used (denormalized)
- `created_at` - Creation timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `name`
- Index on `category_id`
- Index on `usage_count DESC` (popular tags)

**Examples:**
- traditional, contemporary, ceremonial, festive, wedding
- guitar, drums, vocals, instrumental
- vegetarian, vegan, dessert, main-course

---

### 5. content_tags

Many-to-many relationship between content and tags.

```sql
CREATE TABLE content_tags (
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (content_id, tag_id)
);
```

**Columns:**
- `content_id` - Content ID (foreign key)
- `tag_id` - Tag ID (foreign key)
- `created_at` - When tag was added

**Indexes:**
- Primary key on `(content_id, tag_id)`
- Index on `tag_id` (for finding content by tag)

---

### 6. likes

User likes on content.

```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);
```

**Columns:**
- `id` - Primary key (UUID)
- `content_id` - Liked content (foreign key)
- `user_id` - User who liked (foreign key)
- `created_at` - When liked

**Indexes:**
- Primary key on `id`
- Unique composite index on `(content_id, user_id)` (prevent double-likes)
- Index on `content_id` (for content's likes)
- Index on `user_id` (for user's liked content)

**Trigger:**
- Update `content.like_count` when like added/removed

---

### 7. comments

User comments on content.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id` - Primary key (UUID)
- `content_id` - Content being commented on (foreign key)
- `user_id` - Commenter (foreign key)
- `comment_text` - Comment content (max 1000 chars)
- `is_deleted` - Soft delete flag
- `created_at` - Comment timestamp
- `updated_at` - Last edit timestamp

**Indexes:**
- Primary key on `id`
- Index on `content_id` (for content's comments)
- Index on `user_id` (for user's comments)
- Index on `created_at` (for chronological order)

**Trigger:**
- Update `content.comment_count` when comment added/removed

**Constraints:**
- Comment text required, max 1000 characters

---

### 8. follows

User follow relationships.

```sql
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);
```

**Columns:**
- `follower_id` - User who is following (foreign key)
- `following_id` - User being followed (foreign key)
- `created_at` - When follow relationship created

**Indexes:**
- Primary key on `(follower_id, following_id)`
- Index on `following_id` (for getting followers)
- Index on `follower_id` (for getting following list)

**Constraints:**
- Users cannot follow themselves (CHECK constraint)

---

### 9. remixes

Tracks remix relationships between content.

```sql
CREATE TABLE remixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    remix_content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(original_content_id, remix_content_id),
    CHECK (original_content_id != remix_content_id)
);
```

**Columns:**
- `id` - Primary key (UUID)
- `original_content_id` - Original content (foreign key)
- `remix_content_id` - Remixed version (foreign key)
- `created_at` - When remix created

**Indexes:**
- Primary key on `id`
- Index on `original_content_id` (find all remixes of content)
- Index on `remix_content_id` (find original of remix)
- Unique index on `(original_content_id, remix_content_id)`

**Trigger:**
- Update `content.remix_count` on original when remix added

**Constraints:**
- Content cannot remix itself (CHECK constraint)

---

### 10. collaborations

Tracks collaborators on content.

```sql
CREATE TABLE collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator',
    status VARCHAR(20) DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(content_id, user_id)
);
```

**Columns:**
- `id` - Primary key (UUID)
- `content_id` - Content being collaborated on (foreign key)
- `user_id` - Collaborator user (foreign key)
- `role` - Role: 'collaborator', 'elder', 'contributor'
- `status` - Status: 'pending', 'accepted', 'rejected'
- `invited_at` - When invitation sent
- `accepted_at` - When invitation accepted

**Indexes:**
- Primary key on `id`
- Index on `content_id` (for content's collaborators)
- Index on `user_id` (for user's collaborations)
- Unique index on `(content_id, user_id)`

**Constraints:**
- Status must be: 'pending', 'accepted', 'rejected'
- Role must be: 'collaborator', 'elder', 'contributor'

---

## Relationships

### One-to-Many
- **users → content**: One user can create many content pieces
- **users → comments**: One user can write many comments
- **users → likes**: One user can like many content pieces
- **categories → content**: One category contains many content pieces
- **categories → tags**: One category can have many tags
- **content → comments**: One content can have many comments
- **content → likes**: One content can have many likes

### Many-to-Many
- **content ↔ tags**: Content can have multiple tags, tags can be on multiple content (via content_tags)
- **users ↔ users** (follows): Users can follow many users and be followed by many
- **content ↔ content** (remixes): Content can be remixed from multiple originals and have multiple remixes

### Self-Referencing
- **follows**: Users following other users
- **remixes**: Content referencing other content

---

## Indexes Strategy

### Performance Indexes

**High Priority (Frequent Queries):**
1. `content(category_id, created_at DESC)` - Category pages with recent content
2. `content(user_id, created_at DESC)` - User's content feed
3. `content(view_count DESC)` - Popular content
4. `content(like_count DESC)` - Trending content
5. `likes(content_id, user_id)` - Check if user liked content
6. `follows(follower_id)` - User's following list
7. `follows(following_id)` - User's followers

**Medium Priority:**
1. `comments(content_id, created_at)` - Content comments chronologically
2. `remixes(original_content_id)` - Find remixes of content
3. `collaborations(content_id, status)` - Active collaborators
4. `tags(usage_count DESC)` - Popular tags
5. `content_tags(tag_id)` - Content by tag

**Full-Text Search:**
```sql
CREATE INDEX content_search_idx ON content 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### Partial Indexes

For better performance on common filters:
```sql
CREATE INDEX content_published_idx ON content(created_at DESC) 
WHERE status = 'published' AND is_deleted = FALSE;

CREATE INDEX content_user_published_idx ON content(user_id, created_at DESC) 
WHERE status = 'published' AND is_deleted = FALSE;
```

---

## Triggers and Functions

### 1. Updated At Trigger

Auto-update `updated_at` on record changes:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Like Count Trigger

Update content like count:

```sql
CREATE OR REPLACE FUNCTION update_content_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content SET like_count = like_count - 1 WHERE id = OLD.content_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_content_like_count();
```

### 3. Comment Count Trigger

Update content comment count:

```sql
CREATE OR REPLACE FUNCTION update_content_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content SET comment_count = comment_count - 1 WHERE id = OLD.content_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_content_comment_count();
```

### 4. Remix Count Trigger

Update content remix count:

```sql
CREATE OR REPLACE FUNCTION update_content_remix_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content SET remix_count = remix_count + 1 WHERE id = NEW.original_content_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content SET remix_count = remix_count - 1 WHERE id = OLD.original_content_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remixes_count_trigger
AFTER INSERT OR DELETE ON remixes
FOR EACH ROW EXECUTE FUNCTION update_content_remix_count();
```

---

## Migration Strategy

### Phase 1: Core Tables (Sprint 1)
1. Enable UUID extension
2. Create trigger function for updated_at
3. Create `users` table
4. Create `categories` table
5. Create `content` table
6. Seed categories data

### Phase 2: Engagement (Sprint 2)
7. Create `tags` table
8. Create `content_tags` table
9. Create `likes` table with triggers
10. Create `comments` table with triggers

### Phase 3: Social (Sprint 3)
11. Create `follows` table
12. Create `remixes` table with triggers
13. Create `collaborations` table

### Phase 4: Optimization (Sprint 4)
14. Create performance indexes
15. Create full-text search index
16. Create partial indexes
17. Add CHECK constraints
18. Performance testing and tuning

### Rollback Strategy
- Each migration has a corresponding down migration
- Foreign keys with CASCADE allow clean removal
- Test rollback on staging before production
- Backup database before major migrations

### Migration Files
- Numbered sequentially: `001_create_users.sql`
- Include both UP and DOWN migrations
- Idempotent (can run multiple times safely)
- Version controlled in Git

---

## Data Constraints

### Application-Level Validation
- Email format validation
- Password strength (min 8 chars, 1 number)
- Username format (3-50 chars, alphanumeric + underscore)
- File size limits (100MB video, 10MB images)
- File type validation (allowed MIME types)

### Database-Level Constraints
- UNIQUE constraints (email, username, slugs)
- NOT NULL constraints (required fields)
- FOREIGN KEY constraints (referential integrity)
- CHECK constraints (status values, counts >= 0)
- DEFAULT values (timestamps, counts, booleans)

---

## Backup and Maintenance

### Regular Backups
```sql
-- Daily full backup
pg_dump heritage_db > backup_$(date +%Y%m%d).sql

-- Continuous WAL archiving for point-in-time recovery
```

### Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE users;
VACUUM ANALYZE content;
VACUUM ANALYZE likes;
VACUUM ANALYZE comments;
```

### Index Maintenance
```sql
-- Rebuild indexes periodically
REINDEX TABLE content;
```

---

## Performance Considerations

### Query Optimization
1. Use appropriate indexes
2. Avoid N+1 queries (use JOINs)
3. Paginate large result sets
4. Cache frequent queries
5. Use partial indexes for filtered queries

### Denormalization
- Count fields (like_count, comment_count, remix_count) are denormalized
- Updated via triggers for consistency
- Improves read performance at cost of write complexity

### Partitioning (Future)
If content grows to millions of rows:
```sql
-- Partition content by created_at (monthly)
CREATE TABLE content_2024_01 PARTITION OF content
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Security Considerations

1. **Password Storage**: Never store plain passwords, always bcrypt hash
2. **SQL Injection**: Use parameterized queries (pg library handles this)
3. **Row-Level Security**: Can add RLS policies if needed
4. **Sensitive Data**: Don't log password hashes or tokens
5. **Soft Deletes**: Use `is_deleted` flag instead of hard deletes

---

## Testing Strategy

### Unit Tests
- Test constraints
- Test triggers
- Test default values

### Integration Tests
- Test foreign key cascades
- Test unique constraints
- Test complex queries

### Performance Tests
- Query performance with large datasets
- Index effectiveness
- Trigger performance

---

## Database Size Estimates

**Initial (1K users):**
- Users: ~1 MB
- Content: ~100 MB (metadata only, media external)
- Other tables: ~10 MB
- Total: ~110 MB

**Scale (100K users):**
- Users: ~100 MB
- Content: ~10 GB (1M posts)
- Likes: ~500 MB (10M likes)
- Comments: ~2 GB (5M comments)
- Total: ~13 GB

**Note**: Media files stored separately (local filesystem or Cloudinary), not in database.

---

## Next Steps

1. **HER-6**: Create migration files based on this schema
2. **Review**: Team review of schema design
3. **Test**: Create test migrations on local database
4. **Deploy**: Run migrations on production database
5. **Monitor**: Track query performance and optimize as needed