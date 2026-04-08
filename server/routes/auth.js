const express = require("express");
const argon2 = require("argon2");
const db = require("../config/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authMiddleware");
const { sendPasswordResetLink } = require("../utils/mailer");
const router = express.Router();

// ================= REGISTER (Disabled for security - only admin can create users) =================
// This route is intentionally disabled to prevent public registration
// Only admin can create users through /api/admin/users
router.post("/register", async (req, res) => {
  return res.status(403).json({ 
    message: "Public registration is disabled. Only administrators can create accounts." 
  });
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = "SELECT id, name, email, password, role FROM users WHERE email = ?";
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    try {
      const validPassword = await argon2.verify(user.password, password);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET || "your_jwt_secret_key",
        { expiresIn: "8h" }  // Increased from 15m to 8h for better UX
      );

      // Return user data (without password)
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

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

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
      // Don't reveal that email doesn't exist for security
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link." 
      });
    }

    const user = results[0];
    
    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token in database
    const updateSql = "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?";
    
    db.query(updateSql, [resetToken, resetExpiry, user.id], async (updateErr) => {
      if (updateErr) {
        console.error("Save token error:", updateErr);
        return res.status(500).json({ message: "Failed to process request" });
      }

      // Generate reset URL (frontend page)
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
      
      // Send email with reset link
      const emailSent = await sendPasswordResetLink(user.email, user.name, resetUrl);

      res.json({
        message: emailSent 
          ? "Password reset link sent to your email" 
          : "Reset link generated but email sending failed. Please contact admin."
      });
    });
  });
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Find user with valid token (not expired)
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
      
      // Update password and clear reset token
      const updateSql = "UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?";
      
      db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error("Update password error:", updateErr);
          return res.status(500).json({ message: "Failed to reset password" });
        }

        res.json({ message: "Password reset successful. You can now login with your new password." });
      });

    } catch (error) {
      console.error("Hash error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ================= CHANGE PASSWORD (Logged in user) =================
router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both passwords are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

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
      // Verify current password
      const isValid = await argon2.verify(results[0].password, currentPassword);
      
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await argon2.hash(newPassword);
      
      // Update password
      const updateSql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
      
      db.query(updateSql, [hashedPassword, userId], (updateErr) => {
        if (updateErr) {
          console.error("Update error:", updateErr);
          return res.status(500).json({ message: "Failed to change password" });
        }

        res.json({ message: "Password changed successfully" });
      });

    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

module.exports = router;