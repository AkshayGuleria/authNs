import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./config/msalConfig";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/HomePage";
import "./App.css";

function AppContent() {

  return (
    <div className="app">
      <NavBar />
      <main className="main-content">
        <HomePage />
      </main>

      <footer className="footer">
        <p>
          🔐 Microsoft Entra AD Authentication Demo | Built with React + MSAL
        </p>
        <p>
          <a
            href="https://learn.microsoft.com/en-us/entra/identity/authentication/"
            target="_blank"
            rel="noreferrer"
          >
            Learn more about Microsoft Entra ID
          </a>
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
