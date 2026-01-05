# Heritage Platform - Backend API

Node.js/Express backend API for the Heritage Content Platform with PostgreSQL database.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp ../.env.example .env

# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Server runs on: http://localhost:5002

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run dev:ts` | Start with tsx (alternative) |
| `npm start` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed database with test data |

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15 (Supabase)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **File Upload**: Multer + Sharp
- **Testing**: Vitest + Supertest
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── app.ts       # App configuration
│   │   ├── database.ts  # Database connection
│   │   ├── multer.ts    # File upload config
│   │   └── swagger.ts   # API documentation
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   ├── migrate.ts   # Migration runner
│   │   ├── seed.ts      # Database seeder
│   │   └── ...
│   └── server.ts        # Application entry point
├── dist/                # Compiled JavaScript (gitignored)
├── uploads/             # Uploaded files (gitignored)
├── .env                 # Environment variables (gitignored)
├── .env.render.example  # Render deployment template
├── Dockerfile.dev       # Development Docker image
├── Dockerfile.prod      # Production Docker image
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
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
