import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import "./UserProfile.css";
import "../pages/HomePage.css";

interface UserInfo {
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  jobTitle?: string;
  mobilePhone?: string;
}

export const UserProfile = () => {
  const { accounts, instance } = useMsal();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("0s");
  const STORAGE_KEY = "authNs_login_timestamp";

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m${secs}s`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins}m`;
  };

  const fetchUserProfile = async () => {
    if (accounts.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const account = accounts[0];
      
      // Get access token for Microsoft Graph
      const response = await instance.acquireTokenSilent({
        scopes: ["https://graph.microsoft.com/User.Read"],
        account: account,
      });

      // Fetch user profile from Microsoft Graph
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      if (!graphResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await graphResponse.json();
      setUserInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      // Check if login timestamp exists in localStorage
      let loginTimestamp = localStorage.getItem(STORAGE_KEY);
      
      // If no timestamp, create one (first login or no previous storage)
      if (!loginTimestamp) {
        loginTimestamp = Date.now().toString();
        localStorage.setItem(STORAGE_KEY, loginTimestamp);
      }

      // Fetch user profile
      fetchUserProfile();

      // Update elapsed time every second
      const timer = setInterval(() => {
        const storedTimestamp = localStorage.getItem(STORAGE_KEY);
        if (storedTimestamp) {
          const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000);
          setElapsedTime(formatElapsedTime(elapsed));
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // User logged out - clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      setElapsedTime("0s");
    }
  }, [accounts, instance]);

  const isAuthenticated = accounts.length > 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="card info-card">
      <h2>👤 User Profile</h2>

      {loading && <div className="loading">Loading user profile...</div>}

      {error && (
        <div className="error-box">
          <p>⚠️ {error}</p>
        </div>
      )}

      {userInfo && (
        <div className="user-info">
          <div className="info-item">
            <span className="label">Account:</span>
            <span className="value">{accounts[0]?.username}</span>
          </div>
          <div className="info-item">
            <span className="label">Name:</span>
            <span className="value">{accounts[0]?.name}</span>
          </div>
          {userInfo.mail && (
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{userInfo.mail}</span>
            </div>
          )}
          {userInfo.jobTitle && (
            <div className="info-item">
              <span className="label">Job Title:</span>
              <span className="value">{userInfo.jobTitle}</span>
            </div>
          )}
          {userInfo.mobilePhone && (
            <div className="info-item">
              <span className="label">Mobile:</span>
              <span className="value">{userInfo.mobilePhone}</span>
            </div>
          )}
          <div className="info-item">
            <span className="label">Session Duration:</span>
            <span className="value">{elapsedTime}</span>
          </div>
        </div>
      )}

      <button onClick={fetchUserProfile} className="btn btn-refresh">
        🔄 Refresh Profile
      </button>
    </div>
  );
};
