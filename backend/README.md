# Heritage Platform - Backend

Node.js REST API for the Heritage Content Platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: express-validator
- **File Upload**: Multer
- **Image Processing**: Sharp

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── app.js       # App configuration
│   │   └── database.js  # Database connection & helpers
│   ├── controllers/     # Request handlers
│   │   └── auth.controller.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # JWT authentication
│   │   ├── errorHandler.js
│   │   ├── notFoundHandler.js
│   │   └── validate.js  # Validation middleware
│   ├── models/          # Database models
│   │   └── User.model.js
│   ├── routes/          # API routes
│   │   ├── index.js     # Main router
│   │   └── auth.routes.js
│   ├── utils/           # Utility functions
│   │   ├── asyncHandler.js
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── validators.js
│   └── server.js        # Application entry point
├── uploads/             # Local media storage
├── .env                 # Environment variables
├── Dockerfile
├── nodemon.json         # Nodemon configuration
├── package.json
└── README.md
```

## Architecture Patterns

### Clean Architecture
- **Separation of Concerns**: Routes → Controllers → Models
- **Middleware**: Reusable logic (auth, validation, error handling)
- **Utilities**: Helper functions for common operations
- **Configuration**: Centralized app and database config

### Error Handling
All async errors are caught and passed to the global error handler:
```javascript
const asyncHandler = require('./utils/asyncHandler');

router.get('/route', asyncHandler(async (req, res) => {
  // Any errors thrown here are automatically caught
}));
```

### Response Standardization
All responses follow a consistent format:
```javascript
const { successResponse, errorResponse } = require('./utils/response');

// Success
successResponse(res, data, 'User created successfully', 201);

// Error
errorResponse(res, 'Invalid credentials', 401);
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (via Docker Compose)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables (if not using Docker)
cp ../.env.example ../.env

# Run migrations (once database is ready)
npm run migrate
```

### Development

```bash
# Start with hot-reload
npm run dev

# Start without hot-reload
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Base URL
`http://localhost:5000`

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "Heritage Platform API is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

### API Info
```
GET /api
```

Response:
```json
{
  "success": true,
  "message": "Heritage Platform API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

### Planned Endpoints

#### Authentication (HER-10, HER-11)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Users (HER-16)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

#### Content (HER-22, HER-23)
- `POST /api/content` - Create content
- `GET /api/content/:id` - Get content by ID
- `GET /api/content/category/:categoryId` - Get content by category
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

#### Categories (HER-20)
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

## Database

### Connection
Database connection is managed via a connection pool in `src/config/database.js`.

### Query Helper
```javascript
const db = require('./config/database');

// Simple query
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await db.transaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});
```

## Middleware

### Authentication
Protect routes with JWT authentication:
```javascript
const auth = require('../middleware/auth');

router.get('/protected', auth, controller.method);
```

The `auth` middleware:
- Verifies JWT token from `Authorization: Bearer <token>` header
- Attaches user info to `req.user`
- Returns 401 if token is invalid or missing

### Validation
Validate request data:
```javascript
const { registerValidation } = require('../utils/validators');
const validate = require('../middleware/validate');

router.post('/register', registerValidation, validate, controller.register);
```

### Error Handling
Global error handler catches all errors:
- Database errors (unique violations, foreign key violations)
- JWT errors (invalid, expired)
- Validation errors
- Custom errors with status codes

## Environment Variables

Required:
- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret

Optional:
- `NODE_ENV` - Environment (development/production)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `MAX_FILE_SIZE` - Max upload size (default: 100MB)

## Models

Models use static methods for database operations:
```javascript
const User = require('../models/User.model');

// Find user
const user = await User.findByEmail(email);

// Create user
const newUser = await User.create({ email, username, password_hash });

// Update user
const updated = await User.update(userId, { bio: 'New bio' });
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.controller.test.js

# Watch mode
npm run test:watch
```

Test files should be named `*.test.js` and placed alongside the files they test.

## Best Practices

1. **Always use asyncHandler** for async route handlers
2. **Validate all inputs** using express-validator
3. **Use parameterized queries** to prevent SQL injection
4. **Hash passwords** with bcrypt before storing
5. **Use transactions** for operations that modify multiple tables
6. **Log errors** using the logger utility
7. **Return consistent responses** using response utilities
8. **Keep controllers thin** - business logic goes in models or services
9. **Handle errors gracefully** - don't expose internal errors to clients
10. **Document all endpoints** with comments

## Next Steps

1. **HER-6**: Create database migrations
2. **HER-10**: Implement user registration
3. **HER-11**: Implement user login
4. **HER-21**: Implement file upload
5. **HER-22**: Implement content creation

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps database

# View database logs
docker-compose logs database

# Test connection
docker exec -it heritage_db psql -U heritage_user -d heritage_db
```

### Port Already in Use
Change `PORT` in `.env` or stop the conflicting process.

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Keep functions small and focused
4. Use meaningful variable names
5. Add JSDoc comments for complex functions
6. Update this README when adding new features


# User Registration - Testing Guide

## API Endpoint

**POST** `/api/auth/register`

Registers a new user account with email, username, and password.

---

## Request Format

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123"
}
```

### Field Requirements

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format |
| username | string | Yes | 3-50 chars, alphanumeric + underscore |
| password | string | Yes | Min 8 chars, must contain number |

---

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "username": "johndoe",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Valid email is required"
      }
    ]
  }
}
```

#### 409 Conflict - Duplicate Email
```json
{
  "success": false,
  "error": {
    "message": "Email already registered"
  }
}
```

#### 409 Conflict - Duplicate Username
```json
{
  "success": false,
  "error": {
    "message": "Username already taken"
  }
}
```

---

## Testing with cURL

### Valid Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Missing Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "username": "testuser",
    "password": "password123"
  }'
```

### Weak Password (< 8 chars)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "pass123"
  }'
```

### Password Without Number
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "passwordonly"
  }'
```

### Username Too Short
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "ab",
    "password": "password123"
  }'
```

### Username with Invalid Characters
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "test user!",
    "password": "password123"
  }'
```

---

## Testing with JavaScript (fetch)

```javascript
// Register new user
const registerUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@example.com',
        username: 'johndoe',
        password: 'password123'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Registration successful!');
      console.log('User:', data.data.user);
      console.log('Token:', data.data.token);
      
      // Store token for future requests
      localStorage.setItem('token', data.data.token);
    } else {
      console.error('Registration failed:', data.error.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

registerUser();
```

---

## Testing with Postman

1. **Import Collection**
   - File → Import
   - Select `postman/Heritage_Platform_API.postman_collection.json`

2. **Set Environment**
   - Create new environment
   - Add variable: `base_url` = `http://localhost:5000`

3. **Test Registration**
   - Select "Authentication → Register User"
   - Modify body as needed
   - Click Send
   - Token is automatically saved to environment

---

## Automated Tests

### Run Unit Tests

```bash
cd backend
npm test src/__tests__/auth.test.js
```

### Run Integration Tests (with database)

```bash
cd backend
DATABASE_URL=postgres://heritage_user:heritage_password@localhost:5432/heritage_db \
  npm test src/__tests__/auth.integration.test.js
```

### Run All Tests with Coverage

```bash
cd backend
npm test -- --coverage
```

---

## Test Cases Checklist

### ✅ Valid Input Tests
- [x] Register with valid email, username, and password
- [x] Verify user created in database
- [x] Verify password is hashed
- [x] Verify JWT token generated
- [x] Verify no password in response

### ✅ Validation Tests
- [x] Missing email
- [x] Missing username
- [x] Missing password
- [x] Invalid email format
- [x] Password too short (< 8 chars)
- [x] Password without number
- [x] Username too short (< 3 chars)
- [x] Username too long (> 50 chars)
- [x] Username with invalid characters

### ✅ Duplicate Tests
- [x] Duplicate email
- [x] Duplicate username
- [x] Case-insensitive email check

### ✅ Security Tests
- [x] Password is hashed with bcrypt
- [x] Password never exposed in response
- [x] JWT token is valid
- [x] Token contains correct user data

---

## Expected Behavior

### Successful Registration

1. ✅ Validate input data
2. ✅ Check email not already registered
3. ✅ Check username not already taken
4. ✅ Hash password with bcrypt (10 rounds)
5. ✅ Create user in database
6. ✅ Generate JWT token
7. ✅ Return user data (without password) and token

### Failed Registration

1. ❌ Validation fails → Return 400 with errors
2. ❌ Email exists → Return 409 "Email already registered"
3. ❌ Username exists → Return 409 "Username already taken"
4. ❌ Database error → Return 500 with error message

---

## Security Considerations

### Password Security
- ✅ Minimum 8 characters
- ✅ Must contain at least one number
- ✅ Hashed with bcrypt (10 rounds)
- ✅ Never stored in plain text
- ✅ Never returned in responses

### Token Security
- ✅ JWT with 7-day expiration
- ✅ Signed with secure secret
- ✅ Contains only id and email
- ✅ Verified on protected routes

### Input Validation
- ✅ Email format validation
- ✅ Username character restrictions
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (sanitized inputs)

---

## Common Issues

### Issue: "Email already registered"
**Cause**: User already exists with that email  
**Solution**: Use different email or login instead

### Issue: "Username already taken"
**Cause**: User already exists with that username  
**Solution**: Choose different username

### Issue: "Password must be at least 8 characters"
**Cause**: Password too short  
**Solution**: Use longer password

### Issue: "Password must contain at least one number"
**Cause**: Password has no numeric character  
**Solution**: Add at least one number (0-9)

### Issue: "Valid email is required"
**Cause**: Email format invalid  
**Solution**: Use proper email format (user@domain.com)

### Issue: "Username must be between 3 and 30 characters"
**Cause**: Username too short or too long  
**Solution**: Use 3-30 character username

### Issue: "Username can only contain letters, numbers, and underscores"
**Cause**: Username has invalid characters  
**Solution**: Use only a-z, A-Z, 0-9, and underscore

---

## Performance

### Response Times
- **Success**: < 200ms (including password hashing)
- **Validation Error**: < 50ms
- **Duplicate Check**: < 100ms (with database index)

### Rate Limiting (Future)
- Consider adding rate limiting to prevent abuse
- Suggested: 5 registration attempts per IP per hour

---

## Next Steps

After successful registration:

1. **Store token** in localStorage/cookie
2. **Redirect** to dashboard or home
3. **Set user state** in application
4. **Make authenticated requests** using token

Example:
```javascript
// Use token for authenticated requests
const response = await fetch('http://localhost:5000/api/content', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```