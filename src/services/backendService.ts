import { useMsal } from "@azure/msal-react";

interface UseBackendServiceReturn {
  callBackendAPI: <T = unknown>(
    endpoint: string,
    options?: RequestInit
  ) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for making authenticated calls to the backend API
 * Automatically acquires and includes access tokens in requests
 * 
 * IMPORTANT: Update the scope below with your backend app ID from Azure
 * See docs/BACKEND_SETUP.md for complete Azure setup instructions
 * 
 * Steps to Configure:
 * 1. In Azure Portal, go to your backend app registration
 * 2. Go to "Expose an API" and copy the full scope
 * 3. Replace "api://666c0921-4015-42c7-9cd4-57b965d2f2be/Api.Read" below
 * 
 * Example scope: api://87654321-4321-8765-4321-876543218765/access
 * 
 * Usage in components:
 * const { callBackendAPI } = useBackendService();
 * const data = await callBackendAPI<UserData>("/api/protected/me");
 */
export const useBackendService = (): UseBackendServiceReturn => {
  const { instance, accounts } = useMsal();

  const callBackendAPI = async <T = unknown>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    try {
      if (!accounts || accounts.length === 0) {
        throw new Error("No user account found. Please sign in first.");
      }

      // Acquire access token for backend API
      // ⚠️ REQUIRED: Replace this scope with your actual backend scope from Azure Portal
      // Format: api://[your-backend-app-id]/[scope-name]
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ["api://2c1c943e-e8e2-474c-937e-826f00425402/api.access"],
        account: accounts[0],
      });

      // Make the API request with the token
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"}${endpoint}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResponse.accessToken}`,
            ...options?.headers,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error("Backend API call failed:", error);
      throw error;
    }
  };

  return {
    callBackendAPI,
    isLoading: false,
    error: null,
  };
};
