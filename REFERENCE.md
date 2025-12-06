# 📚 MSAL React & Microsoft Entra AD - Complete Reference

## Quick Navigation

- **New to this?** → Start with [Setup Guide](#setup-guide)
- **Want to understand concepts?** → See [Key Concepts](#key-concepts)
- **Ready to code?** → Jump to [Code Examples](#code-examples)
- **Troubleshooting?** → Check [Common Issues](#common-issues)

---

## Setup Guide

### 1️⃣ Prerequisites Check

```bash
# Verify Node.js is installed
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

### 2️⃣ Azure Portal Configuration

**Go to [Azure Portal](https://portal.azure.com)**

```
Step 1: Create App Registration
└── Azure Active Directory
    └── App registrations
        └── New registration
            ├── Name: "authNs-demo"
            ├── Account types: Select as needed
            └── Redirect URI: http://localhost:5173/

Step 2: Note Down Credentials
└── Overview page
    ├── Copy: Application (client) ID
    └── Copy: Directory (tenant) ID

Step 3: Enable Public Client Flow
└── Authentication
    └── Advanced settings
        └── Allow public client flows: YES

Step 4: Configure API Permissions
└── API permissions
    ├── Add a permission
    ├── Select: Microsoft Graph
    ├── Delegated permissions: User.Read
    └── Grant admin consent
```

### 3️⃣ Environment Configuration

```bash
# Create local environment file
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/abcdef12-3456-7890-abcd-ef1234567890
VITE_AZURE_REDIRECT_URI=http://localhost:5173/
```

### 4️⃣ Start Development

```bash
npm install
npm run dev
# Visit http://localhost:5173/
```

---

## Key Concepts

### 🔑 What is Microsoft Entra ID?

Microsoft Entra ID (formerly Azure AD) is:
- Cloud-based identity platform
- Manages user authentication and authorization
- Provides single sign-on (SSO) capabilities
- Integrates with 1000s of SaaS applications

### 🎟️ Tokens Explained

#### ID Token
```json
{
  "oid": "user-object-id",
  "email": "user@company.com",
  "name": "John Doe",
  "iat": 1673012345,
  "exp": 1673016345
}
```
- **Purpose**: User identity
- **Used for**: Determining who the user is
- **Includes**: User claims (email, name, etc.)

#### Access Token
```json
{
  "aud": "https://graph.microsoft.com",
  "scp": "User.Read Mail.Read",
  "oid": "user-object-id",
  "iat": 1673012345,
  "exp": 1673016345
}
```
- **Purpose**: API authorization
- **Used for**: Calling protected APIs
- **Includes**: Scopes (permissions)

### 🔐 Scopes & Permissions

```typescript
// OpenID Connect scopes (for authentication)
const idScopes = ["openid", "profile", "email"];

// Microsoft Graph scopes (for API access)
const graphScopes = [
  "https://graph.microsoft.com/User.Read",      // Read user profile
  "https://graph.microsoft.com/Mail.Read",      // Read email
  "https://graph.microsoft.com/Calendars.Read", // Read calendar
];

// Custom API scopes (for your backend)
const customScopes = ["api://your-app-id/access"];
```

### 🔄 OAuth 2.0 Flow

```
┌─────────────────────────────────────────────────────┐
│                    Authorization Code Flow          │
└─────────────────────────────────────────────────────┘

1. User clicks "Sign In"
   ↓
2. App redirects to Microsoft
   GET /authorize?
     client_id=YOUR_APP_ID&
     redirect_uri=http://localhost:5173/&
     scope=openid%20profile%20email&
     response_type=code
   ↓
3. User logs in at Microsoft
   ↓
4. Microsoft redirects back with code
   GET http://localhost:5173/?code=AUTH_CODE&state=RANDOM
   ↓
5. App exchanges code for tokens
   POST /token
     client_id=YOUR_APP_ID&
     code=AUTH_CODE&
     grant_type=authorization_code
   ↓
6. Microsoft returns tokens
   {
     "id_token": "JWT_ID_TOKEN",
     "access_token": "JWT_ACCESS_TOKEN",
     "refresh_token": "OPTIONAL_REFRESH_TOKEN"
   }
   ↓
7. User is authenticated!
```

---

## Code Examples

### Example 1: Basic Sign In

```typescript
import { useMsal } from "@azure/msal-react";

export function LoginButton() {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account",
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <button onClick={handleLogin}>Sign In with Microsoft</button>;
}
```

### Example 2: Display Current User

```typescript
import { useMsal } from "@azure/msal-react";

export function UserDisplay() {
  const { accounts } = useMsal();

  if (accounts.length === 0) {
    return <p>Not signed in</p>;
  }

  const account = accounts[0];
  return (
    <div>
      <p>Welcome, {account.name}</p>
      <p>Email: {account.username}</p>
    </div>
  );
}
```

### Example 3: Call Microsoft Graph API

```typescript
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";

export function UserProfile() {
  const { instance, accounts } = useMsal();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (accounts.length === 0) return;

    const fetchProfile = async () => {
      try {
        // Get access token
        const response = await instance.acquireTokenSilent({
          scopes: ["https://graph.microsoft.com/User.Read"],
          account: accounts[0],
        });

        // Call Microsoft Graph
        const graphResponse = await fetch(
          "https://graph.microsoft.com/v1.0/me",
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        );

        const data = await graphResponse.json();
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [accounts, instance]);

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h2>{profile.displayName}</h2>
      <p>Email: {profile.mail}</p>
      <p>Job Title: {profile.jobTitle}</p>
    </div>
  );
}
```

### Example 4: Protected Component

```typescript
import { useMsal } from "@azure/msal-react";

interface ProtectedProps {
  children: React.ReactNode;
}

export function ProtectedContent({ children }: ProtectedProps) {
  const { accounts } = useMsal();

  if (accounts.length === 0) {
    return <div>Please sign in to view this content</div>;
  }

  return <>{children}</>;
}

// Usage
function App() {
  return (
    <ProtectedContent>
      <SecretFeature />
    </ProtectedContent>
  );
}
```

### Example 5: Call Your Own Backend API

```typescript
import { useMsal } from "@azure/msal-react";

export function BackendAPICall() {
  const { instance, accounts } = useMsal();

  const callBackendAPI = async () => {
    try {
      // Get token for your API
      const response = await instance.acquireTokenSilent({
        scopes: [`api://${YOUR_API_ID}/access`],
        account: accounts[0],
      });

      // Call your backend
      const apiResponse = await fetch("/api/secure-endpoint", {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      console.log("Data from backend:", data);
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return <button onClick={callBackendAPI}>Call API</button>;
}
```

---

## Common Issues

### Issue 1: Redirect URI Mismatch

**Error:** `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application`

**Cause:** Redirect URI in code doesn't match Azure Portal

**Solution:**
```env
# .env.local
# Make sure this matches exactly what's in Azure Portal
VITE_AZURE_REDIRECT_URI=http://localhost:5173/
```

**In Azure Portal:**
```
App Registration → Authentication → Redirect URIs
✓ http://localhost:5173/
```

### Issue 2: Missing Scopes

**Error:** `AADSTS650053: Application is asking for scopes it hasn't requested for`

**Cause:** Using scopes not configured in Azure Portal

**Solution:**
```
1. Go to App Registration → API permissions
2. Click "Add a permission"
3. Select Microsoft Graph
4. Select required scopes
5. Click "Grant admin consent"
```

### Issue 3: Can't Get Access Token

**Error:** `InteractionRequiredAuthError`

**Cause:** Token cache expired or first time requesting scope

**Solution:**
```typescript
try {
  const response = await instance.acquireTokenSilent({
    scopes: ["User.Read"],
    account: accounts[0],
  });
} catch (error) {
  // Fallback to popup
  const response = await instance.acquireTokenPopup({
    scopes: ["User.Read"],
  });
}
```

### Issue 4: CORS Errors

**Error:** `No 'Access-Control-Allow-Origin' header`

**Cause:** Usually masking an authentication error

**Solution:**
```typescript
// Check:
1. Is your Authorization header correct?
2. Is your token valid and not expired?
3. Are you calling the correct API endpoint?

// Example with better error handling
const response = await fetch("https://graph.microsoft.com/v1.0/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

if (!response.ok) {
  const error = await response.json();
  console.error("API Error:", error);
  // This will show the real error, not CORS
}
```

### Issue 5: Token Not Refreshing

**Error:** `Token has expired` even after refresh

**Cause:** Refresh token is also expired or revoked

**Solution:**
```typescript
// MSAL handles refresh automatically
// But if needed, force re-authentication:
await instance.logout();
await instance.loginPopup();

// Or use forceRefresh flag:
const response = await instance.acquireTokenSilent({
  scopes: ["User.Read"],
  account: accounts[0],
  forceRefresh: true, // Force new token
});
```

---

## Security Best Practices

### ✅ Do This

```typescript
// ✅ Use environment variables
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;

// ✅ Use HTTPS in production
const authority = "https://login.microsoftonline.com/...";

// ✅ Validate tokens before using
if (!response.accessToken) {
  throw new Error("No valid token");
}

// ✅ Use sessionStorage (default in MSAL)
// Clears when browser closes

// ✅ Implement proper logout
instance.logout();

// ✅ Handle token expiration
if (response.expiresOn < Date.now()) {
  // Get new token
}
```

### ❌ Don't Do This

```typescript
// ❌ Hardcode secrets
const clientId = "hardcoded-id"; // WRONG!

// ❌ Store tokens in localStorage
localStorage.setItem("token", accessToken); // Vulnerable to XSS

// ❌ Parse JWT manually
const payload = atob(token.split(".")[1]); // Don't do this

// ❌ Ignore token expiration
// Just use the token without checking

// ❌ Log sensitive data
console.log("Token:", accessToken); // Never log tokens!

// ❌ Disable HTTPS checks
"insecure": true // In production
```

---

## Configuration Reference

### MSAL Configuration

```typescript
const config = {
  auth: {
    // Your app's unique ID
    clientId: "app-id",

    // Where to redirect after login
    authority: "https://login.microsoftonline.com/tenant-id",

    // Where Microsoft redirects back
    redirectUri: "http://localhost:5173/",

    // Where to redirect after logout
    postLogoutRedirectUri: "http://localhost:5173/",
  },

  cache: {
    // Where to store tokens
    // Options: "sessionStorage", "localStorage"
    cacheLocation: "sessionStorage",

    // For IE11 compatibility
    storeAuthStateInCookie: false,
  },

  system: {
    // Logging options
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[${level}] ${message}`);
      },
    },
  },
};
```

---

## Next Learning Steps

1. **Read Official Docs**: https://learn.microsoft.com/en-us/entra/
2. **Explore Microsoft Graph**: https://graph.microsoft.com/
3. **Try Examples**: Build a feature using Graph API
4. **Test Edge Cases**: Implement error handling
5. **Deploy**: Push to production with security checks

---

## Useful Links

### Microsoft Documentation
- [MSAL.js Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser)
- [MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react)
- [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/)
- [Microsoft Graph](https://learn.microsoft.com/en-us/graph/)

### OAuth 2.0 & Security
- [OAuth 2.0 Specification](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

### Tools
- [JWT.io](https://jwt.io/) - Decode and debug JWT tokens
- [Postman](https://www.postman.com/) - Test APIs with tokens

---

**Last Updated**: December 2024

**Version**: 1.0.0
