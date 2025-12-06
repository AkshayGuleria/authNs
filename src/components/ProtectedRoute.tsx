import { useMsal } from "@azure/msal-react";
import { type ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>🔒 Access Denied</h2>
        <p>You must be signed in to view this content.</p>
        <p>Please sign in using the button in the top navigation.</p>
      </div>
    );
  }

  return <>{children}</>;
};
