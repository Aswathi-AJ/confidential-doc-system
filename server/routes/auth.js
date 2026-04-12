const express = require("express");
const argon2 = require("argon2");
const db = require("../config/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require('express-validator');
const verifyToken = require("../middleware/authMiddleware");
const { sendPasswordResetLink, sendSetupLinkEmail } = require("../utils/mailer");
const logActivity = require("../utils/logger");
const router = express.Router();

// ================= ACCOUNT LOCKOUT HELPER FUNCTIONS =================

const MAX_FAILED_ATTEMPTS = 5;  // Lock after 5 failed attempts
const LOCKOUT_MINUTES = 30;      // Lock for 30 minutes

// Check if account is locked
const isAccountLocked = async (email) => {
  const sql = `
    SELECT COUNT(*) as attempts 
    FROM login_attempts 
    WHERE email = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;
  
  const result = await new Promise((resolve, reject) => {
    db.query(sql, [email, LOCKOUT_MINUTES], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
  
  return result.attempts >= MAX_FAILED_ATTEMPTS;
};

// Record failed login attempt
const recordFailedAttempt = async (email, ip) => {
  const sql = "INSERT INTO login_attempts (email, ip_address) VALUES (?, ?)";
  await new Promise((resolve, reject) => {
    db.query(sql, [email, ip], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Clear failed attempts on successful login
const clearFailedAttempts = async (email) => {
  const sql = "DELETE FROM login_attempts WHERE email = ?";
  await new Promise((resolve, reject) => {
    db.query(sql, [email], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// ================= HELPER: Sanitize Input =================
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).trim();
};

// ================= REGISTER (Disabled - Only Admin can create users) =================
router.post("/register", async (req, res) => {
  return res.status(403).json({ 
    message: "Public registration is disabled. Only administrators can create accounts." 
  });
});

// ================= LOGIN (With Validation, Sanitization & Account Lockout) =================
router.post("/login", [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
    .trim()
], async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  // Sanitize inputs
  const email = sanitizeString(req.body.email);
  const password = req.body.password;
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // ✅ CHECK IF ACCOUNT IS LOCKED
  const locked = await isAccountLocked(email);
  if (locked) {
    logActivity(null, "ACCOUNT_LOCKED", "WARNING", `Email: ${email}, IP: ${ip}`);
    return res.status(423).json({ 
      message: "Account temporarily locked due to too many failed attempts. Please try again after 30 minutes." 
    });
  }

  const sql = "SELECT id, name, email, password, role FROM users WHERE email = ?";
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      // Record failed attempt (email doesn't exist)
      await recordFailedAttempt(email, ip);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    try {
      const validPassword = await argon2.verify(user.password, password);

      if (!validPassword) {
        // ✅ RECORD FAILED ATTEMPT
        await recordFailedAttempt(email, ip);
        logActivity(user.id, "LOGIN_FAILED", "FAILED", `Incorrect password from IP: ${ip}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // ✅ CLEAR FAILED ATTEMPTS ON SUCCESSFUL LOGIN
      await clearFailedAttempts(email);

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET || "your_jwt_secret_key",
        { expiresIn: "8h" }
      );

      // Log successful login
      logActivity(user.id, "LOGIN_SUCCESS", "SUCCESS", `User logged in from IP: ${ip}`);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error("Password verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ================= FORGOT PASSWORD (With Validation) =================
router.post("/forgot-password", [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const email = sanitizeString(req.body.email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const sql = "SELECT id, name, email FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      // Security: Don't reveal if email exists
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link." 
      });
    }

    const user = results[0];
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    const updateSql = "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?";
    
    db.query(updateSql, [resetToken, resetExpiry, user.id], async (updateErr) => {
      if (updateErr) {
        console.error("Save token error:", updateErr);
        return res.status(500).json({ message: "Failed to process request" });
      }

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
      const emailSent = await sendPasswordResetLink(user.email, user.name, resetUrl);

      res.json({
        message: emailSent 
          ? "Password reset link sent to your email" 
          : "Reset link generated but email sending failed. Please contact admin."
      });
    });
  });
});

// ================= RESET PASSWORD (With Validation) =================
router.post("/reset-password", [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { token, newPassword } = req.body;

  const sql = "SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()";
  
  db.query(sql, [token], async (err, results) => {
    if (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const user = results[0];

    try {
      const hashedPassword = await argon2.hash(newPassword);
      
      const updateSql = "UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?";
      
      db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error("Update password error:", updateErr);
          return res.status(500).json({ message: "Failed to reset password" });
        }

        logActivity(user.id, "PASSWORD_RESET", "SUCCESS", "User reset password via email link");
        res.json({ message: "Password reset successful. You can now login with your new password." });
      });

    } catch (error) {
      console.error("Hash error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ================= SETUP ACCOUNT (With Validation) =================
router.post("/setup-account", [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { token, password } = req.body;
  
  const sql = "SELECT id FROM users WHERE setup_token = ? AND setup_expiry > NOW()";
  
  db.query(sql, [token], async (err, results) => {
    if (err) {
      console.error("Setup error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired setup link. Please contact administrator." });
    }
    
    const user = results[0];
    
    try {
      const hashedPassword = await argon2.hash(password);
      
      const updateSql = "UPDATE users SET password = ?, setup_token = NULL, setup_expiry = NULL WHERE id = ?";
      
      db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error("Update error:", updateErr);
          return res.status(500).json({ message: "Failed to set up account" });
        }
        
        logActivity(user.id, "ACCOUNT_SETUP", "SUCCESS", "User completed registration");
        
        res.json({ message: "Account setup successful! You can now login with your password." });
      });
      
    } catch (error) {
      console.error("Hash error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ================= CHANGE PASSWORD (Logged in user) =================
router.post("/change-password", verifyToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const sql = "SELECT password FROM users WHERE id = ?";
  
  db.query(sql, [userId], async (err, results) => {
    if (err) {
      console.error("Change password error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      const isValid = await argon2.verify(results[0].password, currentPassword);
      
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await argon2.hash(newPassword);
      const updateSql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
      
      db.query(updateSql, [hashedPassword, userId], (updateErr) => {
        if (updateErr) {
          console.error("Update error:", updateErr);
          return res.status(500).json({ message: "Failed to change password" });
        }

        logActivity(userId, "CHANGE_PASSWORD", "SUCCESS", "User changed password");
        res.json({ message: "Password changed successfully" });
      });

    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ================= ADMIN UNLOCK ACCOUNT (No CSRF required) =================
router.post("/admin/unlock-account", verifyToken, async (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  console.log("=== UNLOCK REQUEST RECEIVED ===");
  console.log("User:", req.user);
  console.log("Body:", req.body);
  
  // Check if user is admin
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  
  try {
    // Check if user exists
    const userSql = "SELECT id, name, email FROM users WHERE email = ?";
    const user = await new Promise((resolve, reject) => {
      db.query(userSql, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Clear login attempts (if table exists)
    try {
      await new Promise((resolve) => {
        db.query("DELETE FROM login_attempts WHERE email = ?", [email], (err) => {
          if (err) console.log("Table may not exist:", err.message);
          resolve();
        });
      });
    } catch(e) {
      console.log("Error clearing attempts:", e.message);
    }
    
    logActivity(req.user.id, "UNLOCK_ACCOUNT", "SUCCESS", `Unlocked account: ${email}`);
    
    res.json({ 
      success: true,
      message: `Account "${email}" unlocked successfully.` 
    });
    
  } catch (error) {
    console.error("Unlock error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;