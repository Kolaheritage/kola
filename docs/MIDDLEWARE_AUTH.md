# JWT Authentication Middleware

**HER-12: JWT Authentication Middleware**

This document describes the JWT authentication middleware for protecting routes in the Kola Heritage Content Platform.

---

## Overview

The authentication middleware provides three variants for different use cases:

1. **`authenticate`** - Lightweight authentication (token info only)
2. **`authenticateWithUser`** - Full authentication (loads complete user from database)
3. **`optionalAuthenticate`** - Optional authentication (doesn't fail if no token)

---

## Middleware Variants

### 1. `authenticate` - Lightweight Authentication

**Use Case:** When you only need user ID and email from the token.

**Features:**
- Extracts and verifies JWT token from Authorization header
- Attaches basic user info (id, email) to `req.user`
- Returns 401 for invalid/expired tokens
- **Fastest option** - No database query

**Usage Example:**
```javascript
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, async (req, res) => {
  // req.user contains: { id: 'uuid', email: 'user@example.com' }
  const userId = req.user.id;

  // Load additional data if needed
  const user = await User.findById(userId);

  res.json({ user });
});
```

**When to Use:**
- Quick operations that only need user ID
- Routes that will load user data anyway
- Maximum performance (no extra DB query)

---

### 2. `authenticateWithUser` - Full Authentication

**Use Case:** When you need complete user profile information.

**Features:**
- Extracts and verifies JWT token
- Loads full user object from database
- Checks if user exists
- Verifies account is active
- Removes password hash before attaching to request
- Attaches complete user profile to `req.user`

**Usage Example:**
```javascript
const { authenticateWithUser } = require('../middleware/auth');

router.get('/me', authenticateWithUser, async (req, res) => {
  // req.user contains complete user object (without password_hash)
  // { id, email, username, bio, avatar_url, is_active, created_at, updated_at }

  res.json({ user: req.user });
});
```

**When to Use:**
- Routes that need user profile data immediately
- User profile management endpoints
- When you want to verify account status upfront

**Additional Checks:**
- User exists in database
- Account is active (is_active = true)

---

### 3. `optionalAuthenticate` - Optional Authentication

**Use Case:** Routes that behave differently for authenticated vs non-authenticated users.

**Features:**
- Attempts to authenticate but doesn't fail if token missing
- Sets `req.user = null` if no token or invalid token
- Never returns error response
- Always calls `next()`

**Usage Example:**
```javascript
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/content/:id', optionalAuthenticate, async (req, res) => {
  const content = await Content.findById(req.params.id);

  // Different behavior based on authentication
  if (req.user) {
    // User is authenticated - include personalized data
    content.liked_by_user = await checkIfUserLiked(req.user.id, content.id);
  } else {
    // User is not authenticated - public view only
    content.liked_by_user = false;
  }

  res.json({ content });
});
```

**When to Use:**
- Public endpoints that enhance experience for logged-in users
- Content discovery pages
- Search functionality
- Anywhere you want to personalize without requiring authentication

---

## Token Format

### Authorization Header

The middleware expects the JWT token in the `Authorization` header:

**Preferred Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Also Supported:**
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload

The JWT token contains:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "iat": 1699876543,
  "exp": 1700481343
}
```

---

## Error Responses

### No Token Provided (401)

**When:** Authorization header is missing

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required. Please provide a valid token.",
    "code": "NO_TOKEN_PROVIDED"
  }
}
```

---

### Token Expired (401)

**When:** Token is valid but has expired

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Token has expired. Please login again.",
    "code": "TOKEN_EXPIRED"
  }
}
```

**Client Action:** Request user to login again

---

### Invalid Token (401)

**When:** Token is malformed or has invalid signature

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid token. Please login again.",
    "code": "INVALID_TOKEN"
  }
}
```

**Client Action:** Clear stored token, redirect to login

---

### User Not Found (401)

**When:** Token is valid but user doesn't exist in database (authenticateWithUser only)

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "User not found. Please login again.",
    "code": "USER_NOT_FOUND"
  }
}
```

**Possible Causes:**
- User was deleted after token was issued
- Database inconsistency

---

### Account Deactivated (401)

**When:** User account is deactivated (authenticateWithUser only)

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Account is deactivated.",
    "code": "ACCOUNT_DEACTIVATED"
  }
}
```

---

### Authentication Error (500)

**When:** Unexpected error during authentication

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Authentication failed. Please try again.",
    "code": "AUTH_ERROR"
  }
}
```

---

## Usage Examples

### Basic Protected Route

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/protected', authenticate, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user
  });
});
```

### Multiple Middleware

```javascript
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileValidation } = require('../utils/validators');

router.put(
  '/profile',
  authenticate,              // 1. Authenticate user
  updateProfileValidation,   // 2. Validate input
  validate,                  // 3. Check validation results
  updateProfileController    // 4. Execute controller
);
```

### Conditional Authentication

```javascript
const { optionalAuthenticate } = require('../middleware/auth');

router.get('/posts', optionalAuthenticate, async (req, res) => {
  const posts = await Post.findAll();

  // Add user-specific data if authenticated
  if (req.user) {
    posts.forEach(post => {
      post.liked = post.likes.includes(req.user.id);
      post.bookmarked = post.bookmarks.includes(req.user.id);
    });
  }

  res.json({ posts });
});
```

### Role-Based Authorization

```javascript
const { authenticateWithUser } = require('../middleware/auth');

// Custom middleware for admin check
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
        code: 'FORBIDDEN'
      }
    });
  }
  next();
};

router.delete(
  '/users/:id',
  authenticateWithUser,  // Load full user
  requireAdmin,          // Check if admin
  deleteUserController
);
```

---

## Performance Considerations

### Choosing the Right Middleware

| Middleware | DB Query | Use Case | Performance |
|------------|----------|----------|-------------|
| `authenticate` | ❌ No | Only need user ID | ⚡ Fastest |
| `authenticateWithUser` | ✅ Yes | Need full user profile | 🐢 Slower |
| `optionalAuthenticate` | ❌ No | Optional auth | ⚡ Fast |

**Recommendation:** Use `authenticate` by default, only use `authenticateWithUser` when you actually need the full user object.

### Caching Considerations

For `authenticateWithUser`, consider implementing caching:

```javascript
const cache = new Map();

const cachedAuthenticateWithUser = async (req, res, next) => {
  const userId = req.user?.id; // From token

  // Check cache first
  if (cache.has(userId)) {
    req.user = cache.get(userId);
    return next();
  }

  // Load from database
  const user = await User.findById(userId);
  cache.set(userId, user, 300); // Cache for 5 minutes

  req.user = user;
  next();
};
```

---

## Testing

### Running Tests

```bash
npm test -- auth.middleware.test.js
```

### Test Coverage

The middleware includes comprehensive tests for:
- ✅ Valid token authentication
- ✅ Missing token handling
- ✅ Invalid token handling
- ✅ Expired token handling
- ✅ User loading from database
- ✅ Deactivated account detection
- ✅ Optional authentication scenarios
- ✅ Error handling
- ✅ Token extraction (with/without Bearer)

### Manual Testing

**1. Get a token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**2. Use token in protected route:**
```bash
TOKEN="your-jwt-token-here"

curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**3. Test expired token:**
```bash
# Use an old/expired token
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer expired-token"
```

---

## Security Best Practices

### ✅ Do's

- **Always use HTTPS in production** to prevent token interception
- **Set appropriate token expiration** (7 days is reasonable)
- **Validate tokens on every request** (stateless authentication)
- **Use strong JWT secrets** (minimum 32 characters, random)
- **Log authentication failures** for security monitoring
- **Implement rate limiting** on protected endpoints
- **Clear tokens on logout** (client-side)

### ❌ Don'ts

- **Don't store sensitive data in JWT payload** (it's not encrypted, only signed)
- **Don't extend token expiration automatically** (require re-login)
- **Don't trust client-provided user data** (always verify via token)
- **Don't expose stack traces** in production error responses
- **Don't reuse JWT secrets** across environments
- **Don't implement token blacklisting without cache** (defeats stateless purpose)

---

## Troubleshooting

### Issue: "NO_TOKEN_PROVIDED" even when token is sent

**Solution:** Check header format
```javascript
// ✅ Correct
Authorization: Bearer eyJhbGci...

// ❌ Incorrect
authorization: Bearer eyJhbGci...  // Wrong case (usually ok)
Token: eyJhbGci...                // Wrong header name
```

---

### Issue: "TOKEN_EXPIRED" immediately after login

**Solution:** Check server time synchronization
```bash
# Check server time
date

# Sync with NTP
sudo ntpdate -s time.nist.gov
```

---

### Issue: "INVALID_TOKEN" with valid-looking token

**Solution:** Verify JWT_SECRET matches between token generation and verification
```bash
# Check environment variable
echo $JWT_SECRET

# Ensure .env file is loaded
# Ensure no trailing spaces in .env file
```

---

### Issue: Performance degradation with authenticateWithUser

**Solution:** Use `authenticate` instead, load user data only when needed
```javascript
// ❌ Slow - loads user on every request
router.get('/posts', authenticateWithUser, getPostsController);

// ✅ Fast - only loads user if needed
router.get('/posts', authenticate, getPostsController);
```

---

## Error Code Reference

| Code | HTTP Status | Meaning | Action |
|------|-------------|---------|--------|
| `NO_TOKEN_PROVIDED` | 401 | No Authorization header | Redirect to login |
| `TOKEN_EXPIRED` | 401 | Token has expired | Redirect to login |
| `INVALID_TOKEN` | 401 | Malformed or wrong signature | Clear token, redirect to login |
| `USER_NOT_FOUND` | 401 | User deleted after token issued | Clear token, redirect to login |
| `ACCOUNT_DEACTIVATED` | 401 | User account disabled | Show deactivation message |
| `AUTH_ERROR` | 500 | Unexpected server error | Retry, contact support |

---

## Implementation Checklist

When protecting a new route:

- [ ] Choose appropriate middleware variant (authenticate vs authenticateWithUser)
- [ ] Import middleware from '../middleware/auth'
- [ ] Add middleware to route before controller
- [ ] Access user via req.user in controller
- [ ] Handle potential null req.user (for optionalAuthenticate)
- [ ] Test with valid token
- [ ] Test with invalid token
- [ ] Test with no token
- [ ] Test with expired token
- [ ] Document authentication requirement in API docs

---

## Future Enhancements

Planned improvements:

- [ ] Refresh token support
- [ ] Token revocation/blacklisting
- [ ] Multi-device session management
- [ ] IP address validation
- [ ] Device fingerprinting
- [ ] Suspicious activity detection
- [ ] Automatic token refresh
- [ ] WebSocket authentication

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Story:** HER-12
