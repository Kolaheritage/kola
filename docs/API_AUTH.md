# Authentication API Documentation

**HER-11: User Login Backend**

This document describes the authentication endpoints for the Kola Heritage Content Platform.

---

## Endpoints

### 1. User Login

**Endpoint:** `POST /api/auth/login`
**Access:** Public
**Rate Limit:** 5 requests per 15 minutes per IP

#### Description
Authenticates a user with email and password, returns a JWT token for subsequent requests.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "UserPassword123"
}
```

#### Request Validation
- **email**: Must be a valid email address (required)
- **password**: Cannot be empty (required)

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "username": "username",
      "bio": "User bio",
      "avatar_url": "https://example.com/avatar.jpg",
      "is_active": true,
      "created_at": "2025-11-13T10:00:00.000Z",
      "updated_at": "2025-11-13T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

**401 Unauthorized - Invalid Credentials**
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

**401 Unauthorized - Account Deactivated**
```json
{
  "success": false,
  "error": {
    "message": "Account is deactivated",
    "code": "ACCOUNT_DEACTIVATED"
  }
}
```

**400 Bad Request - Validation Error**
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

**429 Too Many Requests - Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "message": "Too many login attempts. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

---

### 2. User Registration

**Endpoint:** `POST /api/auth/register`
**Access:** Public
**Rate Limit:** 5 requests per 15 minutes per IP

#### Description
Creates a new user account and returns a JWT token.

#### Request Body
```json
{
  "email": "newuser@example.com",
  "username": "newusername",
  "password": "SecurePass123"
}
```

#### Request Validation
- **email**: Must be a valid email address (required)
- **username**: 3-30 characters, alphanumeric and underscores only (required)
- **password**: Minimum 8 characters, must contain at least one number (required)

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "newuser@example.com",
      "username": "newusername",
      "created_at": "2025-11-13T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

**409 Conflict - User Already Exists**
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters long"
      },
      {
        "field": "password",
        "message": "Password must contain at least one number"
      }
    ]
  }
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newusername",
    "password": "SecurePass123"
  }'
```

---

### 3. User Logout

**Endpoint:** `POST /api/auth/logout`
**Access:** Public

#### Description
Logout endpoint (client-side token removal). Since we use JWT tokens, logout is primarily handled on the client side by removing the token from storage.

#### Request Body
None required

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/auth/logout
```

---

## JWT Token

### Token Format
The JWT token contains the following payload:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "iat": 1699876543,
  "exp": 1700481343
}
```

### Token Expiration
- Default expiration: 7 days
- Configurable via `JWT_EXPIRES_IN` environment variable

### Using the Token
Include the token in the `Authorization` header for protected endpoints:
```
Authorization: Bearer <token>
```

---

## Rate Limiting

### Authentication Endpoints
- **Window:** 15 minutes
- **Max Requests:** 5 per IP
- **Behavior:** Successful requests don't count against the limit
- **Response:** 429 Too Many Requests when exceeded

### Rate Limit Headers
```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1699876543
```

---

## Security Features

### Implemented
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ Input validation with express-validator
- ✅ Rate limiting on auth endpoints
- ✅ Email normalization
- ✅ Account activation status check
- ✅ Password strength requirements

### Password Requirements
- Minimum 8 characters
- At least one number
- Recommended: Include uppercase, lowercase, and special characters

---

## Test Users

After running `npm run seed`, the following test users are available:

| Email | Username | Password | Role |
|-------|----------|----------|------|
| test@example.com | testuser | Test1234 | User |
| admin@example.com | admin | Admin1234 | Admin |
| demo@example.com | demouser | Demo1234 | Demo |

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `ACCOUNT_DEACTIVATED` | User account has been deactivated |
| `USER_EXISTS` | Email already registered |
| `RATE_LIMIT_EXCEEDED` | Too many requests from this IP |

---

## Testing

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Test Coverage
- Login controller: ✅ Fully tested
- Register controller: ✅ Fully tested
- Validation: ✅ Fully tested
- Rate limiting: ⚠️ Integration tests recommended

---

## Environment Variables

Required for authentication:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database
DB_HOST=database
DB_PORT=5433
DB_USER=heritage_user
DB_PASSWORD=heritage_password
DB_NAME=heritage_db
```

---

## Migration and Seeding

### Run Migrations
```bash
# Create users table
npm run migrate
```

### Seed Test Data
```bash
# Create test users
npm run seed
```

---

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Session management
- [ ] Audit logging for login attempts

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Story:** HER-11
