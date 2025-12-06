import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { UserProfile } from "../components/UserProfile";
import "./HomePage.css";

export const HomePage = () => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;
  

  useEffect(() => {
  }, []);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Microsoft Entra AD Authentication Demo</h1>
        <p className="subtitle">
          Learn how to implement secure authentication with Microsoft Entra ID
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="auth-section">
          <div className="card">
            <h2>🔐 Sign In Required</h2>
            <p>
              Click the "Sign In" button in the top navigation to authenticate
              with Microsoft Entra AD.
            </p>
            <p>
              This demo application uses the MSAL React library to securely
              authenticate users with Microsoft Entra ID (formerly Azure AD).
            </p>
          </div>
        </div>
      ) : (
        <div className="authenticated-section">
          <div className="card welcome-card">
            <h2>👋 Welcome, {accounts[0]?.name || accounts[0]?.username}!</h2>
            <p>You are successfully authenticated.</p>
          </div>

          <div className="card features-card">
            <h2>✨ Features Demonstrated</h2>
            <ul>
              <li>✅ Sign In with Microsoft Entra AD</li>
              <li>✅ Sign Out and session cleanup</li>
              <li>✅ User profile retrieval from Microsoft Graph</li>
              <li>✅ Protected routes and components</li>
              <li>✅ Token acquisition and renewal</li>
              <li>✅ Secure API calls to Microsoft Graph</li>
            </ul>
          </div>           
          {isAuthenticated && (
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          )}
        </div>
      )}

      <div className="info-section">
        <div className="card">
          <h3>📚 How It Works</h3>
          <p>
            <strong>Microsoft Entra ID (Azure AD)</strong> is Microsoft's cloud-based
            identity and access management service. This application demonstrates:
          </p>
          <ul>
            <li>
              <strong>Authentication:</strong> Verifying user identity through Microsoft's
              identity platform
            </li>
            <li>
              <strong>Authorization:</strong> Controlling what authenticated users can
              access
            </li>
            <li>
              <strong>Token Management:</strong> Securely handling access tokens for API
              calls
            </li>
            <li>
              <strong>Single Sign-On (SSO):</strong> Seamless authentication across
              applications
            </li>
          </ul>
        </div>

        <div className="card">
          <h3>🚀 Getting Started</h3>
          <ol>
            <li>
              Create an app registration in{" "}
              <a href="https://portal.azure.com" target="_blank" rel="noreferrer">
                Azure Portal
              </a>
            </li>
            <li>
              Copy your <code>Client ID</code> and <code>Tenant ID</code>
            </li>
            <li>Create a <code>.env.local</code> file with your credentials</li>
            <li>
              See the <code>.env.example</code> file for required variables
            </li>
            <li>Sign in and explore the app features</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
