require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/document");
const userManagementRoutes = require("./routes/userManagement");

const app = express();

const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ================= CORS FIRST =================
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || frontendOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'X-Requested-With']
}));

// ================= OTHER MIDDLEWARE =================
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ================= CSRF PROTECTION =================
const csrfProtection = csrf({ cookie: true });

// CSRF Protection - Skip public endpoints
app.use('/api/', (req, res, next) => {
  const publicPaths = [
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/setup-account',
    '/auth/admin/unlock-account',
    '/documents/upload',
    '/csrf-token'
  ];
  
  if (publicPaths.some(path => req.path === path)) {
    return next();
  }
  
  if (req.method === 'GET') {
    return next();
  }
  
  return csrfProtection(req, res, next);
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ================= RATE LIMITING =================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  skipSuccessfulRequests: true,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many reset attempts. Please try again after an hour." },
});

// ================= SECURITY HEADERS =================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://192.168.0.104:5000", "http://192.168.0.104:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);

// ================= ROUTES =================
app.use("/api/documents", documentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", userManagementRoutes);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const verifyToken = require("./middleware/authMiddleware");
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

const checkRole = require("./middleware/roleMiddleware");
app.get("/admin-only", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(" Security: Helmet enabled");
  console.log(" Security: Rate limiting enabled");
  console.log(" Security: CSRF Protection enabled");
  console.log(` CORS: Enabled for ${frontendOrigins.join(", ")}`);
  console.log("Available endpoints:");
  console.log("  POST   /api/auth/login");
  console.log("  POST   /api/documents/upload");
  console.log("  GET    /api/documents/list");
  console.log("  GET    /api/documents/download/:id");
  console.log("  DELETE /api/documents/:id");
  console.log("  GET    /api/admin/users");
  console.log("  POST   /api/admin/users");
  console.log("  GET    /api/csrf-token");
  console.log("  POST   /api/auth/admin/unlock-account");
});