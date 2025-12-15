# Heritage Platform - Backend

Node.js REST API for the Heritage Content Platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript/TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **File Upload**: Multer + Sharp

## Project Structure

```
backend/
├── src/
│   ├── config/              # App and database configuration
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── content.controller.js
│   │   ├── category.controller.js
│   │   └── upload.controller.js
│   ├── routes/              # API route definitions
│   ├── models/              # Database models
│   ├── middleware/          # Auth, validation, error handling
│   ├── utils/               # Helpers (jwt, validators, response)
│   └── server.js            # Application entry point
├── uploads/                 # Local media storage
├── jest.config.js           # Test configuration
└── package.json
```

## API Documentation

Interactive API documentation is available via Swagger UI:

**URL**: `http://localhost:5000/api-docs`

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response schemas
- Authentication support (JWT Bearer tokens)

You can also access the OpenAPI JSON specification at: `http://localhost:5000/api-docs.json`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | No |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get current user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |

### Content
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/content/:id` | Get content by ID | No |
| GET | `/api/content/category/:id` | Get content by category | No |
| POST | `/api/content` | Create new content | Yes |
| PUT | `/api/content/:id` | Update content | Yes |
| DELETE | `/api/content/:id` | Delete content | Yes |

### Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories | No |
| GET | `/api/categories/:id` | Get category by ID | No |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload media file | Yes |

## Development

```bash
# Install dependencies
npm install

# Run with hot-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Authentication

Routes are protected using JWT middleware:

```javascript
const { authenticate } = require('../middleware/auth');

// Lightweight auth (token info only)
router.get('/profile', authenticate, controller.getProfile);

// Full auth (loads user from database)
router.get('/me', authenticateWithUser, controller.getMe);

// Optional auth (doesn't fail without token)
router.get('/content', optionalAuthenticate, controller.list);
```

## Response Format

All responses follow a consistent format:

```javascript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | database |
| `DB_PORT` | Database port | 5432 |
| `DB_USER` | Database user | heritage_user |
| `DB_PASSWORD` | Database password | heritage_password |
| `DB_NAME` | Database name | heritage_db |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | 7d |

## Testing

Tests are located in `src/__tests__/` and use Jest + Supertest.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.controller.test.js

# Watch mode
npm run test:watch
```

## Security Features

- JWT token authentication
- Password hashing (bcryptjs)
- Rate limiting on auth endpoints
- Input validation (express-validator)
- SQL injection prevention (parameterized queries)
- File upload size limits

## Database

```javascript
const db = require('./config/database');

// Query
const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);

// Transaction
await db.transaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});
```
