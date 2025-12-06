# 🔐 Microsoft Entra AD Authentication Learning Guide

## Complete Implementation Tutorial

This document provides a detailed guide to understanding and implementing Microsoft Entra AD authentication with MSAL React.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Azure Portal Setup](#azure-portal-setup)
3. [Code Structure](#code-structure)
4. [Key Concepts](#key-concepts)
5. [Implementation Details](#implementation-details)
6. [Common Patterns](#common-patterns)
7. [Security Considerations](#security-considerations)

---

## Quick Start

### Installation

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Azure credentials
npm run dev
```

### Required Environment Variables

```env
VITE_AZURE_CLIENT_ID=your-app-id
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173/
```

---

## Azure Portal Setup

### Step-by-Step Configuration

#### 1. Create App Registration

```
Azure Portal → Azure Active Directory → App registrations → New registration
```

**Enter Details:**
- Name: `authNs-demo`
- Supported accounts: `Accounts in this organizational directory only`
- Redirect URI: `http://localhost:5173/`

#### 2. Collect Credentials

After registration:
- Copy **Application (client) ID**
- Copy **Directory (tenant) ID**

#### 3. Enable Public Client Flow

```
App Registration → Authentication → Advanced settings
Enable: "Allow public client flows" → Yes
```

#### 4. Configure API Permissions

```
App Registration → API permissions → Add a permission
Select: Microsoft Graph
Permissions: User.Read (Delegated)
Grant admin consent
```

---

## Code Structure

### Configuration Layer

**`src/config/msalConfig.ts`**
- Initializes MSAL with your Azure credentials
- Configures scopes for token requests
- Sets up logging and caching

```typescript
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AUTHORITY,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
  },
  // ... cache and logging config
};
```

### Component Layer

**`src/components/NavBar.tsx`**
- Sign in/out button
- Shows current user
- Responsive navbar

**`src/components/ProtectedRoute.tsx`**
- Restricts content to authenticated users
- Shows access denied message

**`src/components/UserProfile.tsx`**
- Fetches user profile from Microsoft Graph
- Demonstrates token acquisition
- Displays user information

### Page Layer

**`src/pages/HomePage.tsx`**
- Landing page
- Shows authentication status
- Provides setup instructions

### Root Layer

**`src/App.tsx`**
- Wraps app with `MsalProvider`
- Provides MSAL context to all components

---

## Key Concepts

### 1. Authentication vs Authorization

**Authentication**: Verifying who the user is
- Handled by Microsoft Entra ID
- Returns ID token with user claims

**Authorization**: Determining what user can access
- Managed by your application
- Uses access tokens with specific scopes

### 2. Tokens

**ID Token**
- Contains user identity information
- Used for authentication
- JWT format with claims like email, name

**Access Token**
- Needed to call protected APIs
- Has specific scopes
- Expires (typically 1 hour)

### 3. Scopes

Scopes define what permissions an access token has:

```typescript
// OpenID Connect scopes
["openid", "profile", "email"]

// Microsoft Graph scopes
["https://graph.microsoft.com/User.Read"]
```

### 4. MSAL Hooks

**`useMsal()`**
```typescript
const { instance, accounts } = useMsal();
// instance: MSAL instance for authentication
// accounts: Currently authenticated accounts
```

### 5. Authentication Flow

```
┌─────────────────┐
│  User clicks    │
│  "Sign In"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Redirected to Microsoft     │
│ login.microsoftonline.com   │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────┐
│ User enters          │
│ credentials          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────┐
│ Microsoft verifies       │
│ identity                 │
└────────┬─────────────────┘
         │
         ▼
┌───────────────────────────┐
│ Redirected back to app    │
│ with authorization code   │
└────────┬──────────────────┘
         │
         ▼
┌───────────────────────────┐
│ MSAL exchanges code for   │
│ ID token & access token   │
└────────┬──────────────────┘
         │
         ▼
┌───────────────────────────┐
│ Tokens stored in session  │
│ User is authenticated!    │
└───────────────────────────┘
```

---

## Implementation Details

### Sign In Implementation

```typescript
const handleLogin = () => {
  instance.loginPopup({
    scopes: ["User.Read"],
    prompt: "select_account",
  });
};
```

### Sign Out Implementation

```typescript
const handleLogout = () => {
  instance.logout();
};
```

### Token Acquisition

```typescript
// Silently acquire token (uses cache)
const response = await instance.acquireTokenSilent({
  scopes: ["https://graph.microsoft.com/User.Read"],
  account: accounts[0],
});

const accessToken = response.accessToken;
```

### Making Graph API Calls

```typescript
const response = await fetch(
  "https://graph.microsoft.com/v1.0/me",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

const userData = await response.json();
```

---

## Common Patterns

### Pattern 1: Conditional Rendering Based on Auth

```typescript
const { accounts } = useMsal();
const isAuthenticated = accounts.length > 0;

return isAuthenticated ? <AuthenticatedUI /> : <SignInPrompt />;
```

### Pattern 2: Protected Component

```typescript
function ProtectedFeature() {
  const { accounts } = useMsal();
  
  if (accounts.length === 0) {
    return <div>Please sign in</div>;
  }
  
  return <FeatureContent />;
}
```

### Pattern 3: API Call with Error Handling

```typescript
const fetchData = async () => {
  try {
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: ["api://your-api/access"],
      account: accounts[0],
    });
    
    const response = await fetch("/api/data", {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    // Handle error
  }
};
```

---

## Security Considerations

### ✅ Do's

- ✅ Use environment variables for secrets
- ✅ Validate access tokens before using them
- ✅ Implement proper error handling
- ✅ Use HTTPS in production
- ✅ Implement refresh token rotation
- ✅ Log security events
- ✅ Implement rate limiting
- ✅ Use strong CORS policies

### ❌ Don'ts

- ❌ Don't hardcode credentials
- ❌ Don't store tokens in localStorage (use sessionStorage)
- ❌ Don't trust client-side role validation alone
- ❌ Don't expose sensitive scopes
- ❌ Don't implement custom token parsing
- ❌ Don't ignore token expiration
- ❌ Don't skip HTTPS in production
- ❌ Don't log sensitive user data

### Token Security

```typescript
// GOOD: Secure token handling
const response = await instance.acquireTokenSilent({
  scopes: ["User.Read"], // Minimal scopes
  account: accounts[0],
});
// Token is automatically cached by MSAL
// Token is automatically cleared on logout

// BAD: Insecure token handling
localStorage.setItem("token", accessToken); // Vulnerable to XSS
// Tokens exposed in dev tools
// Manual token validation
```

---

## Troubleshooting Guide

### Issue: "AADSTS50105: Your sign-in request was blocked"

**Cause**: Conditional access policies or device compliance

**Solution**:
1. Check Azure Portal for conditional access policies
2. Ensure device meets compliance requirements
3. Contact your tenant administrator

### Issue: Token acquisition fails silently

**Cause**: Token cache issue or token expired

**Solution**:
```typescript
// Clear cache and retry
await instance.clearCache();
const response = await instance.loginPopup();
```

### Issue: Microsoft Graph API returns 403

**Cause**: Missing or insufficient scopes

**Solution**:
1. Verify scopes in `.env.local`
2. Check API permissions in Azure Portal
3. Ensure admin consent is granted
4. Clear browser cache and retry

### Issue: CORS errors

**Cause**: Browser blocking request (usually masking auth error)

**Solution**:
1. Check Authorization header is included
2. Verify access token is valid
3. Check Azure App Registration CORS settings

---

## Advanced Topics

### Multi-Tenant Applications

To support multiple Azure organizations:

```typescript
const msalConfig = {
  auth: {
    authority: "https://login.microsoftonline.com/common",
    // or
    authority: "https://login.microsoftonline.com/organizations",
  },
};
```

### Incremental Consent

Request permissions when needed:

```typescript
const acquireTokenWithNewScope = async (newScope: string) => {
  try {
    return await instance.acquireTokenSilent({
      scopes: [newScope],
      account: accounts[0],
    });
  } catch (error) {
    // Scope not previously consented
    return await instance.loginPopup({
      scopes: [newScope],
    });
  }
};
```

### Custom API Scopes

For your own backend API:

```typescript
// In Azure: App Registration → Expose an API
const scopes = ["api://your-api-id/access"];

const response = await instance.acquireTokenSilent({
  scopes,
  account: accounts[0],
});
```

---

## Learning Resources

### Official Microsoft Documentation
- [MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)
- [OAuth 2.0 & OpenID Connect](https://oauth.net/)

### Recommended Reading
- [OAuth 2.0 Spec](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Spec](https://openid.net/connect/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

---

## Next Steps

1. **Implement backend API** - Protect your own API with tokens
2. **Add role-based access** - Control features based on user roles
3. **Implement device compliance** - Require corporate devices
4. **Add conditional access** - Enforce MFA based on risk
5. **Set up audit logging** - Track authentication events
6. **Deploy to production** - Handle production redirects and HTTPS

---

**Happy learning! 🚀**

For questions, refer to the main [README.md](./README.md) or official documentation.
