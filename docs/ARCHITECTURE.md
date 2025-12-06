# 🏗️ Architecture & Diagrams

## Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
│  (Running at http://localhost:5173/)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              MSAL Provider (App.tsx)                 │ │
│  │  Manages authentication state and provides hooks     │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                               │
│   ┌────────────────────────┼────────────────────────────┐  │
│   │                        │                            │  │
│   ▼                        ▼                            ▼  │
│  NavBar             HomePage              UserProfile    │
│  Component          Component             Component      │
│  ├─ Sign In Btn     ├─ Auth status        ├─ User info  │
│  ├─ Sign Out Btn    ├─ Instructions       └─ Graph API  │
│  └─ User Email      └─ Info cards         call          │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           MSAL Configuration                         │ │
│  │  ├─ Client ID                                        │ │
│  │  ├─ Tenant ID                                        │ │
│  │  ├─ Redirect URI                                     │ │
│  │  └─ Scopes (User.Read, etc)                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Microsoft Entra  │  │ Microsoft Graph  │
         │ ID (Auth)        │  │ API (Data)       │
         └──────────────────┘  └──────────────────┘
```

### Data Flow Diagram

```
USER ACTION: Click "Sign In"
│
▼
NavBar.tsx: handleLogin()
│
▼
instance.loginPopup()
│ (MSAL method)
│
▼
┌─────────────────────────────────────────┐
│  User redirected to Microsoft           │
│  login.microsoftonline.com              │
│                                          │
│  User enters email & password            │
│  Microsoft verifies credentials          │
└─────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│  Microsoft redirects back with code      │
│  http://localhost:5173/?code=ABC123     │
└─────────────────────────────────────────┘
│
▼
MSAL automatically:
├─ Exchanges code for tokens
├─ Stores tokens in sessionStorage
├─ Updates accounts state
└─ Re-renders components

▼
Components detect: accounts.length > 0
│
├─ NavBar shows "Sign Out" button
├─ HomePage shows user info
└─ UserProfile component mounts

▼
UserProfile.tsx: fetchUserProfile()
│
▼
instance.acquireTokenSilent()
│ (Gets access token from cache or refreshes)
│
▼
fetch("https://graph.microsoft.com/v1.0/me")
│ (Call with Authorization header)
│
▼
│ (Microsoft Graph returns user data)
│
▼
setUserInfo(data)
│ (Update component state)
│
▼
Display user profile to user ✅
```

## Component Interaction Diagram

```
                        ┌──────────────────┐
                        │   MSAL Instance  │
                        │ (Shared globally)│
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
                  NavBar      HomePage    UserProfile
                 Component    Component    Component
                    │             │            │
                    ├─Sign In ────┼────────────┤
                    │             │            │
                    ├─Sign Out ───┼────────────┤
                    │             │            │
                    │    (Conditional Rendering Based on accounts)
                    │             │            │
                    └─────────────┴────────────┘
                                 │
                    ┌────────────┴───────────┐
                    │                        │
                    ▼                        ▼
              Show User Email          Show Full Profile
              Show Sign Out Btn       Fetch from Graph API
```

## State Management Flow

```
Global State: MSAL Instance
    │
    ├─► accounts: Account[] (currently signed in users)
    ├─► instance: PublicClientApplication (MSAL instance)
    └─► inProgress: boolean (operation in progress)

Component State Example (UserProfile.tsx):
    │
    ├─► userInfo: UserInfo | null (fetched from Graph)
    ├─► loading: boolean (fetch in progress)
    └─► error: string | null (error message)

State Flow:
    Initial State (No user)
        │
        ▼
    User clicks Sign In
        │
        ▼
    accounts becomes populated
        │
        ▼
    Components re-render (conditional rendering)
        │
        ▼
    UserProfile calls acquireTokenSilent
        │
        ▼
    Fetch from Microsoft Graph
        │
        ├─ Success: setUserInfo(data)
        │
        └─ Error: setError(message)
        │
        ▼
    Components display user data or error
```

## Token Acquisition Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Token Acquisition Process (Silent Flow)            │
└─────────────────────────────────────────────────────────────────┘

instance.acquireTokenSilent({
    scopes: ["https://graph.microsoft.com/User.Read"],
    account: accounts[0]
})
│
▼
┌──────────────────────────────┐
│  Check MSAL Token Cache      │
└──────────────────────────────┘
│
├─ Token Found & Not Expired?
│  │
│  ├─ YES ──────► Return cached token
│  │              │
│  │              ▼
│  │           Use token for API calls ✅
│  │
│  └─ NO ──────► Token expired or not found
│                │
│                ▼
│         ┌─────────────────────────────┐
│         │  Check Refresh Token Cache  │
│         └─────────────────────────────┘
│         │
│         ├─ Refresh Token Available?
│         │  │
│         │  ├─ YES ──────► Exchange refresh token
│         │  │              for new access token
│         │  │              │
│         │  │              ▼
│         │  │           Use new token ✅
│         │  │
│         │  └─ NO ──────► acquireTokenPopup()
│         │                (User must sign in again)
│         │
│         ▼
│     Error: InteractionRequiredAuthError
│
└─────────────────────────────────────────────────────────────────
```

## Authentication State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                  Authentication States                       │
└──────────────────────────────────────────────────────────────┘

                    [INITIAL STATE]
                          │
                          │ User visits app
                          ▼
                  [UNAUTHENTICATED]
                  ├─ accounts.length === 0
                  ├─ NavBar shows Sign In
                  └─ HomePage shows login prompt
                          │
                          │ User clicks Sign In
                          ▼
                  [AUTHENTICATING]
                  ├─ Redirected to Microsoft
                  ├─ User enters credentials
                  └─ Loading state...
                          │
                          │ Microsoft redirects back
                          ▼
                  [AUTHENTICATED] ✅
                  ├─ accounts.length > 0
                  ├─ NavBar shows Sign Out
                  ├─ HomePage shows user info
                  └─ Can make Graph API calls
                          │
             ┌────────────┼────────────┐
             │            │            │
      User clicks  Token Expires  App Reloads
      Sign Out           │             │
             │           │             │
             ▼           ▼             ▼
         [LOGOUT]     [REFRESH] [TOKEN VALIDATION]
             │           │             │
             └───────────┬─────────────┘
                         ▼
                 [UNAUTHENTICATED]
                         │
                         ▼
                 Back to login flow
```

## API Call Sequence

```
USER ACTION: View Profile
│
▼
UserProfile.tsx mounts
│
├─ useEffect triggered
│
▼
1. acquireTokenSilent() {
     GET /msal-cache
     Returns: accessToken (or refreshes if needed)
   }
│
▼
2. fetch("https://graph.microsoft.com/v1.0/me") {
     GET /me
     Headers: {
       Authorization: "Bearer {accessToken}"
     }
   }
│
▼
3. Microsoft Graph validates token
│
├─ Token valid? ──────► Return user data
│
└─ Token invalid? ────► Return 401 Unauthorized
                        (MSAL handles refresh)
│
▼
Response received
│
▼
setUserInfo(data)
│ (Update component state)
│
▼
Component re-renders
│
▼
Display: User name, email, job title ✅
```

## File Interaction Diagram

```
                        ┌────────────────────┐
                        │   index.html       │
                        │ (Entry point)      │
                        └──────────┬─────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │   main.tsx         │
                        │ (Create React app) │
                        └──────────┬─────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │   App.tsx          │
                        │ (MSAL Provider)    │
                        └──────────┬─────────┘
                                   │
            ┌──────────────────────┼─────────────────────┐
            │                      │                     │
            ▼                      ▼                     ▼
        ┌────────────┐    ┌─────────────┐      ┌─────────────────┐
        │  NavBar    │    │  HomePage   │      │  UserProfile    │
        │  .tsx/.css │    │  .tsx/.css  │      │  .tsx/.css      │
        └─────┬──────┘    └─────────────┘      └────────┬────────┘
              │                                         │
              │ Uses:                                   │ Uses:
              │ ├─ useMsal()                           │ ├─ useMsal()
              │ └─ instance.loginPopup()               │ ├─ acquireTokenSilent()
              │                                        │ └─ fetch() to Graph
              │                                        │
              └────────────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  msalConfig.ts           │
                    │  (Configuration)         │
                    └──────────────────────────┘
                           │
                           ├─► Uses env variables
                           │   (.env.local)
                           │
                           └─► Creates msalInstance
                               (PublicClientApplication)
```

## Environment Variable Dependency

```
.env.local (Local Machine)
    │
    ├─ VITE_AZURE_CLIENT_ID
    │  └─► Used in msalConfig.ts
    │     └─► Passed to MSAL
    │        └─► Identifies your app to Microsoft
    │
    ├─ VITE_AZURE_AUTHORITY
    │  └─► Used in msalConfig.ts
    │     └─► Tells MSAL which Azure tenant to use
    │        └─► Controls which users can sign in
    │
    └─ VITE_AZURE_REDIRECT_URI
       └─► Used in msalConfig.ts
          └─► Where Microsoft redirects after login
             └─► Must match Azure Portal config
```

---

## Key Takeaways

1. **MSAL Instance** is the heart of everything
   - Created in `msalConfig.ts`
   - Provided to app via `<MsalProvider>`
   - Used by components via `useMsal()` hook

2. **Accounts** drive conditional rendering
   - `accounts.length > 0` = authenticated
   - `accounts.length === 0` = not authenticated
   - Components check this and render accordingly

3. **Tokens** are acquired on demand
   - First from cache
   - Then by refreshing if needed
   - Then by prompting user if necessary

4. **API Calls** need valid tokens
   - Always request with Authorization header
   - Token is Bearer token (JWT format)
   - API validates token before returning data

5. **State flows** through the component tree
   - Top: MSAL global state
   - Middle: Component local state
   - Bottom: DOM rendering based on state
