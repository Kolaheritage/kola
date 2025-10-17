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