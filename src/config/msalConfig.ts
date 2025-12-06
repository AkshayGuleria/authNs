import { PublicClientApplication, LogLevel, type Configuration } from "@azure/msal-browser";

/**
 * MSAL Configuration for Microsoft Entra AD
 * 
 * Replace the following values with your Azure app registration details:
 * - clientId: Your Application (client) ID from Azure Portal
 * - authority: Your Directory (tenant) ID or organization domain
 * - redirectUri: The redirect URI registered in your Azure app
 */

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "your-client-id-here",
    authority:
      import.meta.env.VITE_AZURE_AUTHORITY ||
      "https://login.microsoftonline.com/your-tenant-id-here",
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || "http://localhost:5173/",
    postLogoutRedirectUri: "http://localhost:5173/",
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" to save cache in cookies to address IE11 issues
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          default:
            break;
        }
      },
    },
  },
};

/**
 * Add scopes here for ID token to be used at MS Identity Platform endpoints.
 * For more information about OIDC scopes, refer to the docs
 * https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens
 */
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

/**
 * Add scopes here for access token to be used at Microsoft Graph API endpoints.
 * To learn more about scopes for Microsoft Graph API,
 * refer to https://learn.microsoft.com/en-us/graph/permissions-reference
 */
export const graphRequest = {
  scopes: ["https://graph.microsoft.com/User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
