# 🔌 Service-to-Service (S2S) Authentication with Microsoft Entra AD

## Overview

Service-to-Service (S2S) authentication enables your React frontend application to securely communicate with a backend service using OAuth 2.0 bearer tokens from Microsoft Entra AD. This pattern is essential for building secure multi-tier applications.

---

## Architecture

### High-Level Flow

```
┌──────────────────┐
│   React App      │
│   (Frontend)     │
└────────┬─────────┘
         │
         │ 1. User Signs In
         │    (with MSAL)
         │
         ▼
┌──────────────────┐
│ Entra AD         │
│ (Identity)       │
└────────┬─────────┘
         │
         │ 2. Returns Access Token
         │
         ▼
┌──────────────────┐
│   Backend API    │
│   (Node/Express) │
└──────────────────┘
         │
         │ 3. Validates Token
         │ 4. Processes Request
         │
         ▼
┌──────────────────┐
│ Microsoft Graph  │
│ or Database      │
└──────────────────┘
```

---

## How S2S Authentication Works

### Step 1: User Authentication (Frontend)
```typescript
const handleLogin = () => {
  instance.ssoSilent({
    scopes: ["User.Read"],
    loginHint: "",
  }).catch(() => {
    instance.loginPopup({
      scopes: ["User.Read"],
    });
  });
};
```
- User signs in with their Microsoft credentials
- MSAL obtains an ID token and access token from Entra AD
- Tokens are stored securely in sessionStorage

### Step 2: Token Acquisition (Frontend Service)
```typescript
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://your-backend-api-id/access"],
  account: accounts[0],
});

const accessToken = tokenResponse.accessToken;
```
- Frontend service requests an access token with backend API scopes
- Token is cached and automatically refreshed when expired
- Token includes claims about the user

### Step 3: Backend Request (Frontend Service)
```typescript
const response = await fetch("http://localhost:5000/api/protected/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```
- Access token is included in the Authorization header
- Request is sent to the backend service
- Token proves the user's identity

### Step 4: Token Validation (Backend)
```typescript
const validateToken = async (token: string) => {
  // Get signing key from JWKS endpoint
  const key = await jwksClient.getSigningKey(decoded.header.kid);
  
  // Verify token signature
  jwt.verify(token, key.getPublicKey(), {
    audience: AZURE_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`,
  });
};
```
- Backend extracts token from Authorization header
- Gets signing key from Azure's JWKS endpoint
- Verifies token signature and claims
- Rejects invalid or expired tokens with 401 Unauthorized

### Step 5: Secure Backend Processing
```typescript
app.get("/api/protected/me", validateToken, (req, res) => {
  const user = req.user; // User info from token claims
  
  // Access user context securely
  res.json({
    userId: user.oid,
    email: user.preferred_username,
  });
});
```
- Backend has validated user identity
- Can access user information from token claims
- Can enforce role-based authorization
- Can call Microsoft Graph on behalf of user

---

## Backend Setup

### 1. Installation

```bash
cd backend
npm install
```

Required dependencies:
- **express** - Web framework
- **jsonwebtoken** - Token validation
- **jwks-rsa** - Get signing keys from Azure
- **axios** - Call Microsoft Graph
- **cors** - Enable cross-origin requests
- **dotenv** - Environment variables

### 2. Environment Configuration

Create `.env` file:

```env
# Azure Entra AD
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

---

## Frontend Integration

### Configure Backend URL

In `.env.local`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

### Use Backend Service

```typescript
import { useBackendService } from "../services/backendService";

function MyComponent() {
  const { callBackendAPI } = useBackendService();

  const fetchData = async () => {
    try {
      const data = await callBackendAPI("/api/protected/me");
      console.log(data);
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

---

## Available Backend Endpoints

### Public Endpoints (No Auth Required)

**GET /api/health**
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "status": "healthy",
  "message": "Backend service is running",
  "timestamp": "2025-12-09T10:30:00Z"
}
```

### Protected Endpoints (Auth Required)

**GET /api/protected/me**
- Returns authenticated user information
- Requires valid access token

Response:
```json
{
  "message": "This is a protected endpoint",
  "user": {
    "oid": "user-object-id",
    "name": "John Doe",
    "email": "john@example.com",
    "tenantId": "tenant-id"
  }
}
```

**GET /api/protected/profile**
- Calls Microsoft Graph API on behalf of user
- Returns user's profile from Graph

Response:
```json
{
  "message": "User profile from Microsoft Graph",
  "profile": {
    "id": "user-id",
    "displayName": "John Doe",
    "email": "john@example.com",
    "jobTitle": "Software Engineer"
  }
}
```

**GET /api/protected/roles**
- Returns user's roles and authorization info
- Useful for role-based access control

Response:
```json
{
  "message": "User role information",
  "roles": ["user", "admin"],
  "isAdmin": true
}
```

**POST /api/protected/data**
- Custom endpoint with business logic
- Accepts JSON body

Request:
```json
{
  "data": "your data here"
}
```

Response:
```json
{
  "message": "Data processed successfully",
  "processedData": {
    "originalData": "your data here",
    "processedBy": "John Doe",
    "userId": "user-oid"
  }
}
```

---

## Security Features

### ✅ Token Validation

1. **Signature Verification** - Token is signed by Microsoft's private key
2. **Audience Verification** - Token is for your backend API
3. **Issuer Verification** - Token is from your Entra AD tenant
4. **Expiration Checking** - Token hasn't expired
5. **JWKS Caching** - Performance optimized

### ✅ Authorization

1. **Role-Based Access Control** - Check user roles from token
2. **Scope-Based Access** - Define granular permissions
3. **User Context** - Secure access to user information
4. **Audit Trail** - Log who accessed what

### ✅ Storage Security

1. **No Token Storage** - Backend doesn't store user tokens
2. **Session Storage** - Frontend uses sessionStorage (cleared on browser close)
3. **HTTPS Only** - Required for production
4. **No Sensitive Logging** - PII is never logged

---

## Azure Portal Configuration

### 1. Create Backend API Registration

```
Azure Portal → App registrations → New registration
├── Name: "authNs-backend"
├── Supported accounts: "Accounts in this organizational directory"
└── Do NOT set Redirect URI
```

### 2. Expose API

```
App Registration → Expose an API
├── Application ID URI: api://your-unique-id
├── Scopes
│   └── New Scope
│       ├── Scope name: access
│       ├── Consent: "Admins and users"
│       └── Display name: "Access backend API"
```

### 3. Configure Frontend App

```
Frontend App Registration → API permissions
├── Add a permission
├── My APIs
├── Select "authNs-backend"
├── Delegated permissions
├── Check "access"
└── Grant admin consent
```

### 4. Backend Configuration

```
Backend App Registration → Certificates & secrets
├── New client secret
├── Copy the value to .env as AZURE_CLIENT_SECRET
```

---

## Common Patterns

### Pattern 1: Call Graph API on Behalf of User

```typescript
app.get("/api/protected/graph", validateToken, async (req, res) => {
  const user = req.user;
  const accessToken = req.accessToken;

  // Call Graph API with user's token
  const response = await axios.get(`${GRAPH_API_URL}/me/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  res.json(response.data);
});
```

### Pattern 2: Role-Based Authorization

```typescript
const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const userRoles = user.roles || [];

    if (!userRoles.includes(role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Required role: ${role}`,
      });
      return;
    }

    next();
  };
};

// Usage
app.delete("/api/admin/users/:id", validateToken, requireRole("admin"), (req, res) => {
  // Only admins can delete users
});
```

### Pattern 3: Custom Claims Validation

```typescript
const validateClaims = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  // Require specific claims
  if (!user.email_verified) {
    res.status(403).json({
      error: "Forbidden",
      message: "Email must be verified",
    });
    return;
  }

  next();
};
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Invalid or missing token

**Solution**:
1. Verify Authorization header format: `Bearer <token>`
2. Check token hasn't expired
3. Verify AZURE_CLIENT_ID matches token audience
4. Check AZURE_TENANT_ID is correct

### Issue: Token Validation Fails

**Cause**: JWKS endpoint unreachable or token format invalid

**Solution**:
1. Check internet connectivity
2. Verify token is JWT format
3. Check Microsoft's JWKS endpoint is accessible
4. Review backend logs for detailed error

### Issue: CORS Errors

**Cause**: Frontend URL not in CORS allow list

**Solution**:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
```

---

## Next Steps

1. **Implement Custom API Logic**
   - Add business logic endpoints
   - Process and store data securely

2. **Add Database Integration**
   - Store processed data
   - Implement data authorization

3. **Implement Admin Panel**
   - Role-based views
   - User management

4. **Deploy to Production**
   - Configure HTTPS
   - Update redirect URIs
   - Set up monitoring and logging

---

## Resources

- [MSAL React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Microsoft Entra ID OAuth 2.0](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [JWT Token Validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens)
- [JWKS and Token Signing](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation)

---

**Happy Building! 🚀**
