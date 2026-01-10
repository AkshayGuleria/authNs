import { useState } from "react";
import { useBackendService } from "../services/backendService";
import "./BackendAPI.css";

interface ApiResponse {
  message?: string;
  user?: {
    oid?: string;
    name?: string;
    email?: string;
    tenantId?: string;
  };
  profile?: {
    displayName?: string;
    email?: string;
    jobTitle?: string;
  };
  error?: string;
}

export const BackendAPI = () => {
  const { callBackendAPI } = useBackendService();
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState("health");

  const handleCallBackend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let data;
      switch (selectedEndpoint) {
        case "health":
          // Health check (public endpoint)
          const healthResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/health`
          );
          data = await healthResponse.json();
          break;

        case "protected-me":
          data = await callBackendAPI("/api/protected/me");
          break;

        case "protected-profile":
          data = await callBackendAPI("/api/protected/profile");
          break;

        case "protected-roles":
          data = await callBackendAPI("/api/protected/roles");
          break;

        case "protected-data":
          data = await callBackendAPI("/api/protected/data", {
            method: "POST",
            body: JSON.stringify({
              data: "Test data from frontend",
            }),
          });
          break;

        default:
          throw new Error("Unknown endpoint");
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getEndpointDescription = () => {
    const descriptions: Record<string, string> = {
      health: "Health check - No authentication required",
      "protected-me": "Protected endpoint - Returns authenticated user info",
      "protected-profile": "Protected endpoint - Calls Microsoft Graph on behalf of user",
      "protected-roles": "Protected endpoint - Returns user roles and authorization info",
      "protected-data": "Protected endpoint - Custom business logic with POST data",
    };
    return descriptions[selectedEndpoint] || "";
  };

  return (
    <div className="backend-api-container">
      <h2>🔌 Backend Service-to-Service Communication</h2>

      <div className="api-section">
        <p className="section-description">
          Test authenticated calls to your backend service. The token is automatically included in requests.
        </p>

        <div className="endpoint-selector">
          <label htmlFor="endpoint-select">Select Endpoint:</label>
          <select
            id="endpoint-select"
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            disabled={loading}
          >
            <option value="health">GET /api/health (Public)</option>
            <option value="protected-me">GET /api/protected/me (Protected)</option>
            <option value="protected-profile">GET /api/protected/profile (Protected + Graph)</option>
            <option value="protected-roles">GET /api/protected/roles (Protected + Auth)</option>
            <option value="protected-data">POST /api/protected/data (Protected + Custom)</option>
          </select>
        </div>

        <p className="endpoint-description">{getEndpointDescription()}</p>

        <button
          onClick={handleCallBackend}
          disabled={loading}
          className="btn btn-backend"
        >
          {loading ? "Calling API..." : "Call Backend API"}
        </button>
      </div>

      {error && (
        <div className="response-section error">
          <h3>❌ Error</h3>
          <pre>{error}</pre>
        </div>
      )}

      {response && (
        <div className="response-section success">
          <h3>✅ Response</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      <div className="info-section">
        <h3>📌 How S2S Authentication Works</h3>
        <ol>
          <li><strong>Frontend</strong> calls a protected backend endpoint</li>
          <li><strong>Frontend service</strong> acquires an access token from Microsoft Entra AD</li>
          <li><strong>Token is sent</strong> in the Authorization header (Bearer token)</li>
          <li><strong>Backend validates</strong> the token signature using JWKS (JSON Web Key Set)</li>
          <li><strong>Backend verifies</strong> token claims (audience, issuer, expiration)</li>
          <li><strong>Backend processes</strong> the request with validated user context</li>
          <li><strong>Backend can call</strong> Microsoft Graph or other APIs using the token</li>
        </ol>
      </div>

      <div className="technical-details">
        <h3>🔧 Technical Details</h3>
        <div className="detail-card">
          <h4>Frontend Service ({`useBackendService`})</h4>
          <ul>
            <li>Acquires access token silently from MSAL cache</li>
            <li>Includes token in Authorization header</li>
            <li>Handles token refresh automatically</li>
          </ul>
        </div>
        <div className="detail-card">
          <h4>Backend Validation</h4>
          <ul>
            <li>Extracts token from Authorization header</li>
            <li>Validates token signature using JWKS endpoint</li>
            <li>Verifies audience (API identifier)</li>
            <li>Verifies issuer (Entra AD tenant)</li>
            <li>Checks token expiration</li>
          </ul>
        </div>
        <div className="detail-card">
          <h4>Protected Resources</h4>
          <ul>
            <li>Only authenticated users can access protected endpoints</li>
            <li>Invalid tokens are rejected with 401 Unauthorized</li>
            <li>Backend can access user context from token claims</li>
            <li>Can be extended with role-based authorization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
