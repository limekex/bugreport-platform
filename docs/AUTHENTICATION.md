# Tester Authentication Guide

The bug reporting platform now supports tester authentication via JWT tokens. This allows you to:

- Track which testers submit bug reports (identity shown in GitHub issues)
- Optionally require authentication before allowing bug submissions
- Manage a list of authorized testers

## Configuration

Add to your `.env` file:

```bash
# JWT secret for signing tokens (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-change-in-production

# Whether authentication is required (optional)
AUTH_REQUIRED=false  # Set to 'true' to require login for all reports
```

## API Endpoints

### Register a New Tester

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "jane@example.com",
  "name": "Jane Doe",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tester": {
    "id": "abc-123-def",
    "email": "jane@example.com",
    "name": "Jane Doe"
  }
}
```

### Login (Get New Token)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tester": {
    "id": "abc-123-def",
    "email": "jane@example.com",
    "name": "Jane Doe"
  }
}
```

### Verify Token

```bash
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "tester": {
    "id": "abc-123-def",
    "email": "jane@example.com",
    "name": "Jane Doe"
  }
}
```

## How It Works

### 1. Register or Login

Use cURL, Postman, or any HTTP client to register a new tester:

```bash
curl -X POST https://gitreport.betait.no/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

Save the returned `token` value.

### 2. Store Token in Browser

Open your application in the browser and run in the console:

```javascript
localStorage.setItem('__bugreport_auth_token__', 'YOUR_TOKEN_HERE');
localStorage.setItem('__bugreport_tester_info__', JSON.stringify({
  id: 'abc-123',
  email: 'test@example.com',
  name: 'Test User'
}));
```

### 3. Submit Bug Reports

The widget SDK will automatically:
- Read the token from localStorage
- Send it with bug report submissions
- Include tester identity in GitHub issues

### 4. GitHub Issue Display

Authenticated reports will show in the **Reporter** section:

```markdown
## Reporter

**Authenticated Tester:** Test User (test@example.com)
**Tester ID:** abc-123-def
```

Unauthenticated reports show:

```markdown
## Reporter

**Tester ID:** unknown (unauthenticated)
**Tester role:** unknown
```

## Security Notes

### Current Implementation

- **Password Hashing:** SHA-256 (basic hashing)
- **Token Expiry:** 30 days
- **Token Storage:** localStorage (client-side)

### Production Recommendations

1. **Use bcrypt for password hashing** (currently using SHA-256)
2. **Enable HTTPS** (tokens transmitted in Authorization header)
3. **Rotate JWT_SECRET regularly**
4. **Consider shorter token expiry** (e.g., 7 days)
5. **Implement refresh tokens** for long-lived sessions
6. **Add email verification**
7. **Implement password reset flow**
8. **Add rate limiting** to auth endpoints

## Managing Testers

### File-based Storage

Testers are stored in `data/testers.json`:

```json
[
  {
    "id": "abc-123-def",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "passwordHash": "5e884...",
    "createdAt": "2026-04-05T10:00:00.000Z",
    "lastLoginAt": "2026-04-05T14:30:00.000Z",
    "isActive": true
  }
]
```

### Disable a Tester

Edit `data/testers.json` and set `isActive: false`:

```json
{
  "id": "abc-123-def",
  "isActive": false
}
```

Disabled testers cannot log in or submit reports.

## Future Enhancements

**Planned for future releases:**

- [ ] **Admin UI** for tester management (create, view, disable)
- [ ] **Widget login modal** (in-app registration and login)
- [ ] **Email verification** before activation
- [ ] **Password reset** via email
- [ ] **Role-based permissions** (admin, tester, viewer)
- [ ] **Audit log** of tester actions

## Troubleshooting

### Token Invalid or Expired

**Symptom:** Getting 401 Unauthorized when submitting reports

**Solution:** Login again to get a fresh token:

```bash
curl -X POST https://gitreport.betait.no/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Authentication Required Error

**Symptom:** "Authentication required. Please log in to submit bug reports."

**Cause:** `AUTH_REQUIRED=true` in `.env` but no valid token provided

**Solution:** Store a valid token in localStorage (see step 2 above)

### Email Already Exists

**Symptom:** 409 error when registering

**Solution:** Use `/api/auth/login` instead to get a token for existing account

### Tester Inactive

**Symptom:** Valid token but still getting 401

**Cause:** Tester account disabled in `data/testers.json`

**Solution:** Check `isActive` field in testers file

## Example: Complete Flow

```bash
# 1. Register
TOKEN=$(curl -s -X POST https://gitreport.betait.no/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","name":"Alice","password":"pass123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Verify token works
curl -X GET https://gitreport.betait.no/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# 3. Use in browser console
echo "localStorage.setItem('__bugreport_auth_token__', '$TOKEN');"
```
