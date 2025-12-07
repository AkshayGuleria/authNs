import { useMsal } from "@azure/msal-react";
import { msalInstance } from "../config/msalConfig";
import "./NavBar.css";

export const NavBar = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const handleLogin = () => {
    instance.ssoSilent({
      scopes: ["User.Read"],
      loginHint: "",
    }).catch(() => {
      instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account",
      });
    });
  };

  const handleLogout = () => {
    instance.logout({
      postLogoutRedirectUri: msalInstance.getConfiguration().auth.postLogoutRedirectUri,
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>🔐 Microsoft Entra AD Authentication</h1>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-section">
              <span className="user-email">{accounts[0]?.username}</span>
              <button onClick={handleLogout} className="btn btn-logout">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn btn-login">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
