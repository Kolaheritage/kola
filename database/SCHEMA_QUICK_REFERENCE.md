# Database Schema Quick Reference

## Tables Overview

| Table | Purpose | Key Indexes | Relationships |
|-------|---------|-------------|---------------|
| **users** | User accounts & profiles | email, username, created_at | → content, comments, likes |
| **categories** | Content categories | name, slug, display_order | → content, tags |
| **content** | User-generated posts | user_id, category_id, created_at, view_count, like_count | ← users, categories; → comments, likes, tags |
| **tags** | Content tags | name, usage_count | ← categories; → content_tags |
| **content_tags** | Content-Tag junction | content_id, tag_id | ← content, tags |
| **likes** | User likes | (content_id, user_id), content_id, user_id | ← content, users |
| **comments** | User comments | content_id, user_id, created_at | ← content, users |
| **follows** | User follows | follower_id, following_id | ← users |
| **remixes** | Content remixes | original_content_id, remix_content_id | ← content |
| **collaborations** | Content collaborators | content_id, user_id | ← content, users |

---

## Common Query Patterns

### 1. Get User's Content
```sql
SELECT * FROM content 
WHERE user_id = $1 
  AND status = 'published' 
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```
**Index Used**: `content(user_id, created_at DESC)`

### 2. Get Category Content
```sql
SELECT c.*, u.username, u.avatar_url
FROM content c
JOIN users u ON c.user_id = u.id
WHERE c.category_id = $1 
  AND c.status = 'published' 
  AND c.is_deleted = FALSE
ORDER BY c.created_at DESC
LIMIT 20;
```
**Index Used**: `content(category_id, created_at DESC)`

### 3. Get Trending Content
```sql
SELECT c.*, u.username
FROM content c
JOIN users u ON c.user_id = u.id
WHERE c.status = 'published' 
  AND c.is_deleted = FALSE
  AND c.created_at > NOW() - INTERVAL '7 days'
ORDER BY c.view_count DESC, c.like_count DESC
LIMIT 20;
```
**Index Used**: `content(view_count DESC)`, `content(like_count DESC)`

### 4. Check if User Liked Content
```sql
SELECT EXISTS(
  SELECT 1 FROM likes 
  WHERE content_id = $1 AND user_id = $2
);
```
**Index Used**: `likes(content_id, user_id)` (unique composite)

### 5. Get Content with Comments Count
```sql
SELECT c.*, u.username, c.comment_count
FROM content c
JOIN users u ON c.user_id = u.id
WHERE c.id = $1;
```
**Note**: `comment_count` is denormalized for performance

### 6. Get User's Feed (from followed users)
```sql
SELECT c.*, u.username, u.avatar_url
FROM content c
JOIN users u ON c.user_id = u.id
JOIN follows f ON f.following_id = c.user_id
WHERE f.follower_id = $1
  AND c.status = 'published'
  AND c.is_deleted = FALSE
ORDER BY c.created_at DESC
LIMIT 20;
```
**Index Used**: `follows(follower_id)`, `content(user_id, created_at DESC)`

### 7. Search Content
```sql
SELECT c.*, u.username,
       ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), 
               plainto_tsquery('english', $1)) as rank
FROM content c
JOIN users u ON c.user_id = u.id
WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) 
      @@ plainto_tsquery('english', $1)
  AND c.status = 'published'
  AND c.is_deleted = FALSE
ORDER BY rank DESC, c.created_at DESC
LIMIT 20;
```
**Index Used**: `content_search_idx (GIN)`

### 8. Get Random Content per Category
```sql
SELECT DISTINCT ON (c.category_id) c.*, u.username
FROM content c
JOIN users u ON c.user_id = u.id
WHERE c.status = 'published' 
  AND c.is_deleted = FALSE
ORDER BY c.category_id, RANDOM()
LIMIT 6;
```
**Note**: For better performance with large datasets, use alternative methods

### 9. Get Remixes of Content
```sql
SELECT c.*, u.username
FROM content c
JOIN remixes r ON r.remix_content_id = c.id
JOIN users u ON c.user_id = u.id
WHERE r.original_content_id = $1
  AND c.status = 'published'
  AND c.is_deleted = FALSE
ORDER BY c.created_at DESC;
```
**Index Used**: `remixes(original_content_id)`

### 10. Get User's Liked Content
```sql
SELECT c.*, u.username
FROM content c
JOIN likes l ON l.content_id = c.id
JOIN users u ON c.user_id = u.id
WHERE l.user_id = $1
  AND c.status = 'published'
  AND c.is_deleted = FALSE
ORDER BY l.created_at DESC
LIMIT 20;
```
**Index Used**: `likes(user_id)`, `content(id)`

---

## Performance Tips

### DO's ✅
1. **Use indexes wisely** - Query planner will use appropriate indexes
2. **Paginate results** - Always use LIMIT and OFFSET
3. **Use joins** - Avoid N+1 queries
4. **Use denormalized counts** - like_count, comment_count are faster than COUNT(*)
5. **Use partial indexes** - For frequently filtered queries (status, is_deleted)
6. **Analyze queries** - Use EXPLAIN ANALYZE to check query plans

### DON'Ts ❌
1. **Don't SELECT *** - Select only needed columns
2. **Don't use OFFSET for deep pagination** - Use cursor-based pagination instead
3. **Don't query without WHERE** - Always filter results
4. **Don't use LIKE '%term%'** - Use full-text search instead
5. **Don't forget transactions** - Use transactions for multi-table updates

---

## Maintenance Queries

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Find Unused Indexes
```sql
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND indexrelname NOT LIKE '%_pkey';
```

### Vacuum Stats
```sql
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

---

## Common Operations

### Create User
```sql
INSERT INTO users (email, username, password_hash)
VALUES ($1, $2, $3)
RETURNING id, email, username, created_at;
```

### Create Content
```sql
INSERT INTO content (user_id, category_id, title, description, media_url, media_type, thumbnail_url)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;
```

### Like Content
```sql
-- Add like
INSERT INTO likes (content_id, user_id)
VALUES ($1, $2)
ON CONFLICT (content_id, user_id) DO NOTHING;

-- Remove like
DELETE FROM likes 
WHERE content_id = $1 AND user_id = $2;
```

### Add Comment
```sql
INSERT INTO comments (content_id, user_id, comment_text)
VALUES ($1, $2, $3)
RETURNING id, created_at;
```

### Follow User
```sql
INSERT INTO follows (follower_id, following_id)
VALUES ($1, $2)
ON CONFLICT (follower_id, following_id) DO NOTHING;
```

### Create Remix
```sql
-- First create the new content
INSERT INTO content (...) VALUES (...) RETURNING id;

-- Then link as remix
INSERT INTO remixes (original_content_id, remix_content_id)
VALUES ($1, $2);
```

---

## Data Seeding

### Categories
```sql
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
('Rituals', 'rituals', 'Traditional ceremonies and rituals', '🕯️', 1),
('Dance', 'dance', 'Traditional and contemporary dances', '💃', 2),
('Music', 'music', 'Musical performances and compositions', '🎵', 3),
('Recipes', 'recipes', 'Traditional recipes and cooking methods', '🍲', 4),
('Stories', 'stories', 'Oral histories and cultural stories', '📖', 5),
('Crafts', 'crafts', 'Traditional crafts and handiwork', '🎨', 6);
```

### Sample Tags
```sql
INSERT INTO tags (name, category_id) VALUES
('traditional', 1), ('contemporary', NULL), ('ceremonial', 1),
('festive', NULL), ('wedding', 1), ('guitar', 3),
('drums', 3), ('vocals', 3), ('instrumental', 3),
('vegetarian', 4), ('vegan', 4), ('dessert', 4);
```

---

## Constraints Summary

| Table | Unique Constraints | Check Constraints | Foreign Keys |
|-------|-------------------|-------------------|--------------|
| users | email, username | - | - |
| categories | name, slug | - | - |
| content | - | status IN (...), counts >= 0 | user_id, category_id |
| tags | name | - | category_id |
| content_tags | (content_id, tag_id) | - | content_id, tag_id |
| likes | (content_id, user_id) | - | content_id, user_id |
| comments | - | - | content_id, user_id |
| follows | (follower_id, following_id) | follower_id != following_id | follower_id, following_id |
| remixes | (original, remix) | original != remix | both content_ids |
| collaborations | (content_id, user_id) | status IN (...) | content_id, user_id |

---

## Migration Checklist

- [ ] Enable uuid-ossp extension
- [ ] Create update_updated_at trigger function
- [ ] Create users table
- [ ] Create categories table
- [ ] Seed categories
- [ ] Create content table
- [ ] Create tags table
- [ ] Create content_tags table
- [ ] Create likes table + trigger
- [ ] Create comments table + trigger
- [ ] Create follows table
- [ ] Create remixes table + trigger
- [ ] Create collaborations table
- [ ] Create all indexes
- [ ] Create full-text search index
- [ ] Test all constraints
- [ ] Test all triggers
- [ ] Performance test with sample data