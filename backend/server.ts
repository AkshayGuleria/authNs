import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import axios from "axios";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURATION
// ============================================

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || "your-tenant-id";
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || "your-client-id";
const JWKS_URI = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`;
const GRAPH_API_URL = "https://graph.microsoft.com/v1.0";

// Create JWKS client for token validation
const jwksClient = new JwksClient({
  jwksUri: JWKS_URI,
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Custom interface for Express Request with user data
interface AuthenticatedRequest extends Request {
  user?: JwtPayload | string;
  accessToken?: string;
}

// ============================================
// TOKEN VALIDATION MIDDLEWARE
// ============================================

/**
 * Validates the bearer token from the Authorization header
 * Extracts and verifies the JWT token from Microsoft Entra AD
 */
const validateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);
    req.accessToken = token;

    // Decode token without verification first to get the kid (key ID)
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      res.status(401).json({
        error: "Invalid Token",
        message: "Token could not be decoded",
      });
      return;
    }

    // Get the signing key from JWKS
    const key = await jwksClient.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    // Verify the token signature and claims
    const verified = jwt.verify(token, signingKey, {
      audience: AZURE_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`,
    });

    req.user = verified;
    next();
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401).json({
      error: "Invalid Token",
      message: error instanceof Error ? error.message : "Token verification failed",
    });
  }
};

// ============================================
// ROUTES
// ============================================

/**
 * Health check endpoint (no authentication required)
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    message: "Backend service is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Protected endpoint that requires valid token
 * Returns information about the authenticated user
 */
app.get("/api/protected/me", validateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as JwtPayload | undefined;

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    message: "This is a protected endpoint",
    user: {
      oid: user.oid,
      name: user.name,
      email: user.preferred_username,
      tenantId: user.tid,
    },
    token: {
      issuer: user.iss,
      audience: user.aud,
      expiresAt: new Date(user.exp! * 1000).toISOString(),
    },
  });
});

/**
 * Protected endpoint that demonstrates calling Microsoft Graph
 * on behalf of the authenticated user
 */
app.get("/api/protected/profile", validateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accessToken = req.accessToken;

    // Call Microsoft Graph API with the user's token
    const response = await axios.get(`${GRAPH_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json({
      message: "User profile from Microsoft Graph",
      profile: {
        id: response.data.id,
        displayName: response.data.displayName,
        email: response.data.userPrincipalName,
        jobTitle: response.data.jobTitle,
        officeLocation: response.data.officeLocation,
        mobilePhone: response.data.mobilePhone,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Protected endpoint demonstrating authorization
 * This example checks if user has admin role
 */
app.get("/api/protected/roles", validateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as JwtPayload;

  // In a real scenario, check roles from Azure AD Groups or App Roles
  const roles = user.roles || [];
  const isAdmin = roles.includes("admin");

  res.json({
    message: "User role information",
    roles,
    isAdmin,
    allClaims: user,
  });
});

/**
 * Example of custom business logic endpoint
 * Demonstrates processing data with authentication
 */
app.post("/api/protected/data", validateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const { data } = req.body;

    if (!data) {
      res.status(400).json({
        error: "Bad Request",
        message: "Data field is required",
      });
      return;
    }

    res.json({
      message: "Data processed successfully",
      processedData: {
        originalData: data,
        processedBy: user.name,
        processedAt: new Date().toISOString(),
        userId: user.oid,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

/**
 * Global error handler
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal Server Error",
    message: error.message,
  });
});

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🔐 Service-to-Service Auth Backend               ║
║  Running on: http://localhost:${PORT}                ║
║  Environment: ${process.env.NODE_ENV || "development"}                     ║
╚════════════════════════════════════════════════════╝
  `);
  console.log(`
📋 Available Endpoints:
  - GET  /api/health                  (Public)
  - GET  /api/protected/me            (Protected)
  - GET  /api/protected/profile       (Protected - Calls Graph API)
  - GET  /api/protected/roles         (Protected - Role check)
  - POST /api/protected/data          (Protected - Custom logic)
  `);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Either:`);
    console.error(`   1. Change PORT in .env (current: ${PORT})`);
    console.error(`   2. Kill process: lsof -i :${PORT} | grep -v COMMAND | awk '{print $2}' | xargs kill -9`);
    process.exit(1);
  } else {
    throw error;
  }
});

export default app;
