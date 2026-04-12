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

// ================= SECURITY MIDDLEWARE =================

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });

// CSRF Protection - Skip public and unlock endpoints
app.use('/api/', (req, res, next) => {
  const publicPaths = [
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/setup-account',
    '/auth/admin/unlock-account'  // ✅ Add unlock endpoint here
  ];
  
  if (publicPaths.some(path => req.path === path)) {
    return next();
  }
  
  if (req.method === 'GET') {
    return next();
  }
  
  return csrfProtection(req, res, next);
});

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rate Limiting
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

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'X-Requested-With']
}));

app.use(express.json());
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);

// Routes
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(" Security: Helmet enabled");
  console.log(" Security: Rate limiting enabled");
  console.log(" Security: CSRF Protection enabled");
  console.log("Available endpoints:");
  console.log("  POST   /api/auth/login");
  console.log("  POST   /api/auth/admin/unlock-account");
  console.log("  GET    /api/csrf-token");
});