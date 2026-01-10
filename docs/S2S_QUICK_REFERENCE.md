# Quick Reference: Service-to-Service Authentication

## What is S2S Authentication?

Service-to-Service (S2S) authentication allows your frontend React app to securely call your backend API using OAuth 2.0 bearer tokens from Microsoft Entra AD.

```
User Signs In → Gets Token → Frontend calls Backend with Token → Backend validates → Process request
```

---

## Quick Commands

### Start Both Services

**Terminal 1 (Frontend):**
```bash
npm run dev
# http://localhost:5173
```

**Terminal 2 (Backend):**
```bash
cd backend
npm run dev
# http://localhost:3001
```

---

## ⚠️ Critical Configuration: Backend API Scope

Before running the backend, you MUST configure the scope in your frontend code.

### What is a Scope?

A scope is a permission string that tells Azure: "Frontend, you can access the Backend API"

**Format:** `api://[backend-app-id]/[scope-name]`

**Example:** `api://87654321-4321-8765-4321-876543218765/access`

### Step 1: Get Your Scope from Azure

1. Go to [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations
3. Select your **backend app** (NOT frontend app)
4. Go to **Expose an API**
5. Under "Scopes defined by this API", copy the full scope
   - Should look like: `api://[app-id]/[scope-name]`

### Step 2: Update Frontend Code

File: `src/services/backendService.ts`

```typescript
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://87654321-4321-8765-4321-876543218765/access"],  // ← Your scope here!
  account: accounts[0],
});
```

Replace `87654321-4321-8765-4321-876543218765/access` with YOUR actual scope.

### Step 3: Also Update Backend URL

File: `.env.local`

```env
VITE_BACKEND_URL=http://localhost:3001
```

---

## Configuration Checklist

### Frontend (.env.local)
```env
✓ VITE_AZURE_CLIENT_ID=your-frontend-app-id
✓ VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
✓ VITE_AZURE_REDIRECT_URI=http://localhost:5173/
✓ VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env.local)
```env
✓ AZURE_TENANT_ID=your-tenant-id
✓ AZURE_CLIENT_ID=your-backend-app-id
✓ PORT=3001
✓ FRONTEND_URL=http://localhost:5173
```

### Frontend Code
```typescript
✓ Updated scopes in src/services/backendService.ts
✓ Scope format: api://[backend-app-id]/[scope-name]
✓ Backend API permission added in Azure Portal
✓ Admin consent granted
```

---

## API Flow

### 1. Frontend User Sign-In
```typescript
// NavBar.tsx
const handleLogin = () => {
  instance.ssoSilent({
    scopes: ["User.Read"],
  }).catch(() => {
    instance.loginPopup({
      scopes: ["User.Read"],
    });
  });
};
```

### 2. Frontend Calls Backend
```typescript
// BackendAPI.tsx or any component
const { callBackendAPI } = useBackendService();
const data = await callBackendAPI("/api/protected/me");
```

### 3. Service Acquires Token
```typescript
// backendService.ts
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://backend-api-id/access"],
  account: accounts[0],
});
```

### 4. Frontend Sends Request
```typescript
fetch("http://localhost:3001/api/protected/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### 5. Backend Validates Token
```typescript
// server.ts
const validateToken = async (req, res, next) => {
  const token = req.headers.authorization.substring(7);
  const verified = jwt.verify(token, signingKey, {
    audience: AZURE_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`,
  });
  req.user = verified;
  next();
};
```

### 6. Backend Processes Request
```typescript
// Use user info from token
app.get("/api/protected/me", validateToken, (req, res) => {
  res.json({
    userId: req.user.oid,
    email: req.user.preferred_username,
  });
});
```

---

## Backend Endpoints

### Public (No Auth)
- `GET /api/health` - Health check

### Protected (Auth Required)
- `GET /api/protected/me` - User info
- `GET /api/protected/profile` - User from Graph API
- `GET /api/protected/roles` - User roles
- `POST /api/protected/data` - Custom logic

---

## Error Handling

### 401 Unauthorized
**Cause**: Invalid or missing token

**Check**:
- Authorization header present?
- Token format: `Bearer <token>`?
- Token expired?
- AZURE_CLIENT_ID correct?
- AZURE_TENANT_ID correct?

### 403 Forbidden
**Cause**: User lacks required role

**Check**:
- User has required role?
- Role claim in token?

### 500 Internal Server Error
**Cause**: Backend processing error

**Check**:
- Logs for detailed error
- Graph API call working?
- Database connection valid?

---

## Testing

### Test 1: Public Endpoint (Curl)
```bash
curl http://localhost:3001/api/health
```

### Test 2: Protected Endpoint (Frontend UI)
1. Sign In on frontend
2. Scroll to "Backend Service-to-Service Communication"
3. Select endpoint
4. Click "Call Backend API"
5. View response

### Test 3: Direct API Call (Postman)
1. Get access token from frontend console
2. Create request to `http://localhost:3001/api/protected/me`
3. Add Authorization header: `Bearer <token>`
4. Send request

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Don't store tokens in localStorage
- [ ] Validate all tokens
- [ ] Don't log sensitive data
- [ ] Use environment variables for secrets
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Monitor for suspicious activity

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify token and tenant ID |
| CORS errors | Check FRONTEND_URL in backend .env |
| Port already in use | Change PORT in .env or kill process |
| Can't call Graph API | Add User.Read permission in Azure |
| Token expired | MSAL handles refresh automatically |

---

## File Structure

```
Frontend                     Backend
────────────────────────────────────
src/
├── services/
│   └── backendService.ts   → Calls backend
├── components/
│   └── BackendAPI.tsx      → UI for testing
└── pages/
    └── HomePage.tsx        → Shows all features

backend/
├── server.ts               → Token validation & endpoints
├── package.json            → Dependencies
├── tsconfig.json           → TypeScript config
├── .env.local              → Configuration
└── .env.example            → Template
```

---

## Next Steps

1. **Install & Run** - Follow Backend Setup Guide
2. **Test** - Use Frontend UI to test endpoints
3. **Add Features** - Implement custom endpoints
4. **Add Database** - Store user data
5. **Deploy** - Move to production

---

## Learn More

- [Full S2S Documentation](./SERVICE_TO_SERVICE.md)
- [Backend Setup Guide](./BACKEND_SETUP.md)
- [Microsoft Entra ID Docs](https://learn.microsoft.com/en-us/entra/)
- [OAuth 2.0 Spec](https://tools.ietf.org/html/rfc6749)

---

**Happy building! 🚀**
