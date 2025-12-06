# 🔐 Microsoft Entra AD Authentication - Complete Learning Project

A comprehensive, production-ready React application demonstrating Microsoft Entra AD authentication using MSAL React, TypeScript, and Vite. This project serves as a complete learning guide and reference implementation for implementing modern authentication in web applications.

## 📂 Documentation Structure

All detailed documentation has been organized in the **`docs/`** folder for easy navigation:

- **[Quick start guide](#quick-start)**
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Visual diagrams and system design
- **[docs/REFERENCE.md](./docs/REFERENCE.md)** - Code examples & troubleshooting
- **[docs/PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md)** - Project overview

---

## 📋 What This Repository Provides

### Features Included

- ✅ **Microsoft Entra AD Integration** - Full OAuth 2.0 / OpenID Connect implementation
- ✅ **MSAL React Library** - Modern authentication with token management
- ✅ **Microsoft Graph API Integration** - Fetch authenticated user profile data
- ✅ **Protected Routes** - Conditional rendering based on authentication state
- ✅ **Session Tracking** - Display elapsed time since login with localStorage persistence
- ✅ **TypeScript Support** - Full type safety throughout the application
- ✅ **Modern Development Stack** - React 18, Vite, ESLint, and more
- ✅ **Responsive UI** - Clean, modern interface
- ✅ **Error Handling** - Comprehensive error handling and user feedback
- ✅ **Security Best Practices** - Token handling, CORS, and authorization patterns

### Technology Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety and developer experience |
| **Vite** | Fast development and build tooling |
| **MSAL React** | Microsoft Entra AD authentication |
| **Microsoft Graph API** | User data and profile information |
| **ESLint** | Code quality and consistency |

### Project Structure

```
src/
├── components/
│   ├── NavBar.tsx              # Sign in/out UI
│   ├── ProtectedRoute.tsx       # Access control wrapper
│   └── UserProfile.tsx          # User profile display with session tracking
├── pages/
│   └── HomePage.tsx             # Landing page with setup guide
├── config/
│   └── msalConfig.ts            # MSAL configuration
├── App.tsx                      # Root component with MsalProvider
└── main.tsx                     # Application entry point
```

---

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- A Microsoft Azure subscription
- An Azure App Registration (see setup guide below)

### Installation

```bash
# Clone or extract the repository
cd authNs

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Azure credentials
nano .env.local

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

---

## 🔧 Azure Portal Setup Guide

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Enter application details:
   - **Name**: `authNs-demo` (or your preferred name)
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: `Web` → `http://localhost:5173/`
4. Click **Register**

### Step 2: Collect Your Credentials

After registration, you'll see the application details page:

- Copy the **Application (client) ID** → `VITE_AZURE_CLIENT_ID`
- Copy the **Directory (tenant) ID** → `VITE_AZURE_AUTHORITY` (use as `https://login.microsoftonline.com/{tenant-id}`)

### Step 3: Enable Public Client Flow

1. Go to your app registration → **Authentication**
2. Under **Advanced settings**, toggle **Allow public client flows** to **Yes**
3. Click **Save**

### Step 4: Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph**
3. Choose **Delegated permissions**
4. Search for and select **User.Read**
5. Click **Add permissions**
6. Click **Grant admin consent for [your organization]**

### Step 5: Update Environment Variables

Create or edit `.env.local`:

```env
VITE_AZURE_CLIENT_ID=your-app-id-here
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here
VITE_AZURE_REDIRECT_URI=http://localhost:5173/
```

---

## 📚 Understanding the Implementation

### Authentication Flow

```
User Clicks Sign In
        ↓
Browser Redirects to Azure Login
        ↓
User Enters Credentials
        ↓
Azure Verifies Identity
        ↓
Browser Redirected Back with Auth Code
        ↓
MSAL Exchanges Code for Tokens
        ↓
Tokens Stored in Session
        ↓
User is Authenticated! ✓
```

### Key Components

#### 1. **NavBar Component** (`src/components/NavBar.tsx`)
- Displays sign in/out button
- Shows current authenticated user's email
- Responsive design

```tsx
// Using MSAL hooks
const { instance, accounts } = useMsal();
const isAuthenticated = accounts.length > 0;
```

#### 2. **ProtectedRoute Component** (`src/components/ProtectedRoute.tsx`)
- Restricts content to authenticated users only
- Shows "Access Denied" for unauthenticated users
- Reusable wrapper for protected pages

```tsx
function ProtectedFeature() {
  const { accounts } = useMsal();
  
  if (accounts.length === 0) {
    return <div>Please sign in first</div>;
  }
  
  return <ProtectedContent />;
}
```

#### 3. **UserProfile Component** (`src/components/UserProfile.tsx`)
- Fetches user profile from Microsoft Graph API
- Displays user information (name, email, phone, etc.)
- Shows session duration (elapsed time since login)
- Demonstrates token acquisition and API calls

Key Features:
- **Token Acquisition**: Uses `acquireTokenSilent()` to get access tokens
- **Graph API Integration**: Fetches `/me` endpoint data
- **Session Tracking**: Displays elapsed time that persists across page refreshes
- **Error Handling**: Comprehensive error messages and user feedback

```tsx
// Token acquisition pattern
const response = await instance.acquireTokenSilent({
  scopes: ["https://graph.microsoft.com/User.Read"],
  account: accounts[0],
});
const accessToken = response.accessToken;

// Making API call with token
const graphResponse = await fetch(
  "https://graph.microsoft.com/v1.0/me",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

#### 4. **MSAL Configuration** (`src/config/msalConfig.ts`)
- Initializes MSAL with Azure credentials
- Configures cache behavior
- Sets up logging and error handling

```typescript
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: import.meta.env.VITE_AZURE_AUTHORITY,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

---

## 🔑 Core Concepts

### Authentication vs Authorization

| Concept | Meaning |
|---------|---------|
| **Authentication** | Verifying who the user is (handled by Azure) |
| **Authorization** | Determining what user can access (your app) |

### Token Types

**ID Token**
- Contains user identity information
- Used for authentication
- JWT format with claims (email, name, etc.)

**Access Token**
- Required to call protected APIs
- Has specific scopes (permissions)
- Expires (typically 1 hour)
- Automatically refreshed by MSAL

### Scopes

Scopes define what permissions a token has:

```typescript
// OpenID Connect scopes (user identity)
["openid", "profile", "email"]

// Microsoft Graph scopes (API permissions)
["https://graph.microsoft.com/User.Read"]

// Your custom API scopes
["api://your-api-id/access"]
```

### MSAL Hooks

```typescript
// Main hook for authentication
const { instance, accounts } = useMsal();

// instance: MSAL PublicClientApplication
// - methods: loginPopup(), logout(), acquireTokenSilent()
// - manages authentication and token refresh

// accounts: Array of authenticated accounts
// - empty array = user not authenticated
// - contains user info when authenticated
```

---

## 📖 Common Implementation Patterns

### Pattern 1: Conditional Rendering Based on Auth

```typescript
export function ProtectedContent() {
  const { accounts } = useMsal();
  
  if (accounts.length === 0) {
    return <SignInPrompt />;
  }
  
  return <AuthenticatedContent />;
}
```

### Pattern 2: Making Protected API Calls

```typescript
const fetchUserData = async () => {
  try {
    // Get access token
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: ["https://graph.microsoft.com/User.Read"],
      account: accounts[0],
    });
    
    // Call API with token
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
    // Show error to user
  }
};
```

### Pattern 3: Session Tracking with Persistence

```typescript
// Store login timestamp on authentication
const STORAGE_KEY = "authNs_login_timestamp";

useEffect(() => {
  if (accounts.length > 0) {
    // Store or retrieve login timestamp
    let timestamp = localStorage.getItem(STORAGE_KEY);
    if (!timestamp) {
      timestamp = Date.now().toString();
      localStorage.setItem(STORAGE_KEY, timestamp);
    }
    
    // Update elapsed time every second
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
      setElapsedTime(formatElapsedTime(elapsed));
    }, 1000);
    
    return () => clearInterval(timer);
  } else {
    // Clean up on logout
    localStorage.removeItem(STORAGE_KEY);
  }
}, [accounts]);
```

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ **Use Environment Variables** - Store secrets in `.env.local`, never in code
- ✅ **Validate Tokens** - Verify token claims before using sensitive data
- ✅ **Implement Error Handling** - Show appropriate errors without exposing internals
- ✅ **Use HTTPS** - Required in production for secure token transmission
- ✅ **Let MSAL Manage Tokens** - Don't manually handle or store tokens
- ✅ **Use sessionStorage** - Better than localStorage for sensitive data
- ✅ **Implement Rate Limiting** - Protect APIs from abuse
- ✅ **Log Security Events** - Track authentication failures

### ❌ Don'ts

- ❌ **Don't Hardcode Credentials** - Use environment variables
- ❌ **Don't Store Tokens in localStorage** - Use MSAL's built-in session storage
- ❌ **Don't Trust Client-Side Only** - Validate permissions on backend
- ❌ **Don't Expose Sensitive Scopes** - Request minimal permissions needed
- ❌ **Don't Implement Custom Token Parsing** - Use MSAL's token handling
- ❌ **Don't Ignore Token Expiration** - MSAL handles this automatically
- ❌ **Don't Log Tokens or PII** - Protect user privacy
- ❌ **Don't Skip HTTPS** - Required for production

### Token Security Example

```typescript
// ✅ GOOD: MSAL handles everything
const tokenResponse = await instance.acquireTokenSilent({
  scopes: ["User.Read"], // Minimal scopes
  account: accounts[0],
});
// Token automatically cached and refreshed by MSAL
// Token cleared on logout
// No exposure in dev tools

// ❌ BAD: Manual token handling
const token = tokenResponse.accessToken;
localStorage.setItem("token", token); // Vulnerable to XSS!
// Need to handle expiration manually
// Need to implement refresh logic
// Need to clear manually
```

---

## 🐛 Troubleshooting

### "AADSTS50105: Your sign-in request was blocked"

**Cause**: Conditional access policies or device requirements

**Solution**:
1. Check Azure Portal for conditional access policies
2. Ensure device meets compliance requirements
3. Contact your Azure tenant administrator

### Token acquisition fails with timeout

**Cause**: Network issues or token cache problems

**Solution**:
```typescript
// Clear cache and retry
await instance.clearCache();
const response = await instance.loginPopup();
```

### "403 Forbidden" from Microsoft Graph API

**Cause**: Missing API permissions or scopes

**Solution**:
1. Verify `.env.local` has correct credentials
2. Check Azure Portal → API permissions
3. Ensure admin consent is granted
4. Clear browser cache and try again

### CORS errors in console

**Cause**: Usually masking an authentication error

**Solution**:
1. Verify Authorization header is present
2. Check access token is valid (not expired)
3. Verify API permissions in Azure
4. Check browser console for detailed error

---

## 📦 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎓 Learning Path

### Beginner

1. **Run the Application** - Install and start with `npm run dev`
2. **Azure Setup** - Follow the setup guide above
3. **Understand Components** - Study NavBar, ProtectedRoute, UserProfile
4. **Token Basics** - Learn about ID tokens and access tokens

### Intermediate

1. **API Integration** - Understand how to fetch user profile from Graph API
2. **Token Acquisition** - Learn `acquireTokenSilent()` and `loginPopup()`
3. **State Management** - See how authentication state is managed
4. **Error Handling** - Understand error scenarios and handling

### Advanced

1. **Custom APIs** - Protect your own backend API with tokens
2. **Role-Based Access** - Control features based on user roles
3. **Multi-Tenant Apps** - Support multiple Azure organizations
4. **Incremental Consent** - Request permissions when needed
5. **Conditional Access** - Implement MFA based on risk policies

---

## 📚 Additional Resources

### Official Microsoft Documentation
- [MSAL.js React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Microsoft Entra ID Docs](https://learn.microsoft.com/en-us/entra/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)

### Specifications
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Specification](https://openid.net/connect/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

### Related Guides
- See `LEARNING_GUIDE.md` for detailed implementation tutorials
- See `ARCHITECTURE.md` for system design and patterns
- Check `QUICK_COMMANDS.sh` for common development commands

---

## 🔨 Development Setup

### Recommended Vite Plugins

By default, this project uses:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) - Fast Refresh with Babel

For optimal performance in production, you can also use:
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) - SWC for faster builds

### ESLint Configuration (Production Ready)

For production applications, enable type-aware linting:

```js
// eslint.config.js
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Use strict type-aware rules
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### React Compiler (Optional)

The React Compiler is disabled by default for performance. To enable:

See [React Compiler Installation](https://react.dev/learn/react-compiler/installation)

---

## 📄 License

This project is provided as a learning resource.

---

## 🤝 Contributing

This is a reference implementation. Feel free to use it as a starting point for your own projects.

---

**Last Updated**: December 2025

For detailed implementation tutorials, see `LEARNING_GUIDE.md`
