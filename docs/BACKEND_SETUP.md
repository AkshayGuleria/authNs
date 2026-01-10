# 🚀 Backend Setup Guide - Service-to-Service Authentication

## Quick Start (5 minutes)

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Backend

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 4. Configure Frontend

Add to your `.env.local`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 5. Test the Connection

Click "Backend Service-to-Service Communication" in the frontend to test:
- Health check (public)
- Protected endpoints (authenticated)

---

## Detailed Setup

### Prerequisites

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Backend and frontend running simultaneously

### Installation Steps

#### Step 1: Navigate to Backend Directory

```bash
cd /path/to/authNs/backend
```

#### Step 2: Install Dependencies

```bash
npm install
```

Installs:
- **express** - Web framework
- **cors** - Cross-origin support
- **dotenv** - Environment variables
- **jsonwebtoken** - JWT handling
- **jwks-rsa** - Key validation
- **axios** - HTTP client
- **typescript** - Type safety
- **tsx** - TypeScript execution

#### Step 3: Create Azure App Registrations

You need **TWO** separate app registrations in Azure:
1. **Frontend App** - for user authentication
2. **Backend App** - for API protection

##### 3a. Backend App Registration (If you haven't already)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `authNs-backend-api` (or your name)
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now (backend doesn't use redirects)
5. Click **Register**

**Copy these values:**
- **Application (client) ID** → `AZURE_CLIENT_ID` in `.env.local`
- **Directory (tenant) ID** → `AZURE_TENANT_ID` in `.env.local`

##### 3b. Expose an API in Backend App

1. Go to your backend app → **Expose an API**
2. If no Application ID URI, click "Set" and accept the default
   - This will be: `api://your-backend-app-id`
3. Click **Add a scope** under "Scopes defined by this API"
4. Fill in:
   - **Scope name**: `access` (or `api.access`)
   - **Admin consent display name**: `Access Backend API`
   - **Admin consent description**: `Allows access to backend API`
   - **User consent display name**: `Access Backend API`
   - **User consent description**: `Allows access to backend API`
5. Click **Add scope**

**Copy this value:**
- The full scope: `api://your-backend-app-id/access` → Use in frontend code

##### 3c. Frontend App - Add Backend API Permission

1. Go to your frontend app → **API permissions**
2. Click **Add a permission**
3. Select **My APIs** tab → Select your backend app
4. Select **Delegated permissions** → Check `access`
5. Click **Add permissions**
6. **Grant admin consent** (click the button that appears)

Now your frontend can request the backend scope.

##### 3d. Frontend Code - Update Scope

In `src/services/backendService.ts`, update the scope:

```typescript
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://your-backend-app-id/access"],  // ← Update this!
  account: accounts[0],
});
```

Replace `your-backend-app-id` with your actual backend app ID from Azure.

---

#### Step 4: Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Required: Azure Credentials
AZURE_TENANT_ID=12345678-1234-5678-1234-567812345678
AZURE_CLIENT_ID=87654321-4321-8765-4321-876543218765

# Optional: Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional: For service-to-service M2M
AZURE_CLIENT_SECRET=your-client-secret-here
```

#### Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════╗
║  🔐 Service-to-Service Auth Backend               ║
║  Running on: http://localhost:5000                 ║
║  Environment: development                          ║
╚════════════════════════════════════════════════════╝

📋 Available Endpoints:
  - GET  /api/health                  (Public)
  - GET  /api/protected/me            (Protected)
  - GET  /api/protected/profile       (Protected - Calls Graph API)
  - GET  /api/protected/roles         (Protected - Role check)
  - POST /api/protected/data          (Protected - Custom logic)
```

---

## Verify Installation

### Test 1: Health Check (No Auth)

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Backend service is running",
  "timestamp": "2025-12-09T10:30:00Z"
}
```

### Test 2: Protected Endpoint (With Auth)

Use the Frontend UI:
1. Sign In on the frontend
2. Scroll to "Backend Service-to-Service Communication"
3. Select "GET /api/protected/me"
4. Click "Call Backend API"

Should see user information in the response.

---

## Development Workflow

### File Structure

```
backend/
├── server.ts              ← Main backend file
├── package.json           ← Dependencies
├── tsconfig.json          ← TypeScript config
├── .env.example           ← Environment template
└── .env.local             ← Your configuration (git-ignored)
```

### Code Changes

When you modify `server.ts`:
1. Backend automatically reloads (via tsx watch)
2. No need to restart manually
3. Check console for errors

### Debugging

```typescript
// Add logging
console.log("Token:", token);
console.log("User:", user);
console.error("Error:", error);
```

Use browser DevTools Network tab to inspect:
- Authorization header
- Response status codes
- Error messages

---

## Building for Production

### Build TypeScript

```bash
npm run build
```

Creates `dist/` folder with compiled JavaScript.

### Start Production Server

```bash
npm start
```

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (configure SSL certificate)
- [ ] Update FRONTEND_URL to production domain
- [ ] Store secrets in environment/vault (not .env)
- [ ] Enable CORS for production domain only
- [ ] Set secure headers
- [ ] Enable logging and monitoring
- [ ] Test with production credentials

---

## Extending the Backend

### Add a New Protected Endpoint

```typescript
// In server.ts
app.get("/api/protected/custom", validateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as JwtPayload;

  // Your custom logic
  res.json({
    message: "Custom endpoint",
    userId: user.oid,
  });
});
```

### Call Microsoft Graph

```typescript
app.get("/api/protected/emails", validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await axios.get(`${GRAPH_API_URL}/me/messages`, {
      headers: {
        Authorization: `Bearer ${req.accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});
```

### Add Database Integration

```typescript
import { Pool } from "pg"; // Example: PostgreSQL

const pool = new Pool();

app.post("/api/protected/save-data", validateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as JwtPayload;
  const { data } = req.body;

  try {
    await pool.query("INSERT INTO user_data (user_id, data) VALUES ($1, $2)", [user.oid, data]);
    res.json({ message: "Data saved" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save" });
  }
});
```

---

## 📚 Azure App Registration Reference Guide

### Complete Setup Checklist

#### Backend App Registration
- [ ] Created app in Azure Portal
- [ ] Copied Application (client) ID
- [ ] Copied Directory (tenant) ID
- [ ] Added to `.env.local` as `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`

#### Backend API Exposure
- [ ] Set Application ID URI (e.g., `api://your-app-id`)
- [ ] Created scope named `access` or `api.access`
- [ ] Copied full scope string: `api://your-app-id/access`

#### Frontend Configuration
- [ ] Added backend app API permission
- [ ] Granted admin consent
- [ ] Updated `backendService.ts` scope to: `api://your-app-id/access`
- [ ] Updated `.env.local` with `VITE_BACKEND_URL=http://localhost:5000`

### Step-by-Step: Getting the Scope

**What is a Scope?**
A scope is a permission string that tells Azure what access your frontend needs. Format: `api://app-id/scope-name`

**Example:**
```
api://87654321-4321-8765-4321-876543218765/access
                 ↑                                 ↑
            Your backend         Name you created in Step 3b
            app ID
```

**Where to Find Your App ID:**
1. Azure Portal → Azure Active Directory → App registrations
2. Select your backend app
3. Copy the "Application (client) ID"
4. Use it in the scope: `api://[paste-here]/access`

**Where to Use the Scope:**
In `src/services/backendService.ts`:
```typescript
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://87654321-4321-8765-4321-876543218765/access"],  // ← Your scope here
  account: accounts[0],
});
```

### Complete Azure Portal Walkthrough

#### 1. Create Backend App Registration
```
Azure Portal
  ↓
Azure Active Directory
  ↓
App registrations
  ↓
New registration
  ↓
Name: authNs-backend-api
Supported account types: Single tenant
  ↓
Register
  ↓
✓ Copy Application (client) ID
✓ Copy Directory (tenant) ID
```

#### 2. Expose API
```
Your Backend App
  ↓
Expose an API
  ↓
Application ID URI: Click "Set" → Accept default (api://app-id)
  ↓
Add a scope
  ↓
Scope name: access
Admin consent display name: Access Backend API
Admin consent description: Allows access to backend API
  ↓
Add scope
  ↓
✓ Copy full scope: api://app-id/access
```

#### 3. Configure Frontend App
```
Your Frontend App (in Azure)
  ↓
API permissions
  ↓
Add a permission
  ↓
My APIs tab → Select your backend app
  ↓
Delegated permissions → Check "access"
  ↓
Add permissions
  ↓
Grant admin consent (click button that appears)
```

#### 4. Update Frontend Code
```typescript
// src/services/backendService.ts
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["api://your-backend-app-id/access"],  // ← Update with your scope
  account: accounts[0],
});
```

### Environment Variables Map

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `AZURE_TENANT_ID` | Backend app → Overview → Directory ID | `12345678-1234-5678-1234-567812345678` |
| `AZURE_CLIENT_ID` | Backend app → Overview → Application ID | `87654321-4321-8765-4321-876543218765` |
| `VITE_BACKEND_URL` | Set to localhost or your domain | `http://localhost:5000` |
| Frontend Scope | Backend app → Expose an API → Scope | `api://87654321-4321-8765-4321-876543218765/access` |

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Change PORT in .env.local
PORT=5001
```

### Issue: CORS Errors in Frontend

**Problem**: Frontend can't call backend

**Solution**:
```typescript
// Check CORS settings in server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Ensure FRONTEND_URL in .env matches your frontend URL
```

### Issue: Token Validation Fails

**Problem**: 401 Unauthorized errors

**Solution**:
1. Verify `AZURE_TENANT_ID` is correct
2. Verify `AZURE_CLIENT_ID` matches your backend app
3. Check token hasn't expired
4. Review backend logs for detailed error

### Issue: Can't Call Microsoft Graph

**Problem**: 403 or 401 from Graph API

**Solution**:
1. Verify backend app has "User.Read" permission
2. Verify admin consent is granted
3. Check API endpoint URL is correct
4. Use correct scopes in frontend

---

## Next Steps

1. **Test All Endpoints** - Verify each endpoint works
2. **Add Custom Logic** - Implement your business logic
3. **Add Database** - Store and retrieve data
4. **Deploy** - Move to production
5. **Monitor** - Set up logging and alerts

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWKS and Token Validation](https://tools.ietf.org/html/rfc7517)
- [Microsoft Entra ID Documentation](https://learn.microsoft.com/en-us/entra/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Backend setup complete! 🎉**

Next: See [SERVICE_TO_SERVICE.md](./SERVICE_TO_SERVICE.md) for detailed documentation.
