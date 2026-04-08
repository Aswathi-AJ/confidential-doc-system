const express = require("express");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const db = require("../config/db");
const router = express.Router();
const logActivity = require("../utils/logger");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/mailer");
// ================= CREATE NEW USER (ADMIN ONLY) WITH EMAIL =================
router.post(
  "/users",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    if (!["admin", "officer", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    try {
      // Check if user already exists
      const checkSql = "SELECT id FROM users WHERE email = ?";
      const checkResult = await new Promise((resolve, reject) => {
        db.query(checkSql, [email], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      if (checkResult.length > 0) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user
      const sql = `
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      db.query(sql, [name, email, hashedPassword, role], async (err, result) => {
        if (err) {
          console.error("Error creating user:", err);
          return res.status(500).json({ message: "Failed to create user" });
        }
        
        // Send welcome email with credentials and login link
        const emailSent = await sendWelcomeEmail(email, name, password, role);
        
        logActivity(req.user.id, "CREATE_USER", "SUCCESS", `Created user: ${email} with role: ${role}, Email sent: ${emailSent}`);
        
        res.status(201).json({
          message: emailSent 
            ? "User created successfully. Credentials sent via email." 
            : "User created successfully but email notification failed.",
          user: {
            id: result.insertId,
            name,
            email,
            role
          }
        });
      });
      
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= RESET PASSWORD (WITH EMAIL) =================
router.post(
  "/users/:id/reset-password",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    try {
      // Get user details first
      const getUserSql = "SELECT name, email FROM users WHERE id = ?";
      const user = await new Promise((resolve, reject) => {
        db.query(getUserSql, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result[0]);
        });
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
      
      db.query(sql, [hashedPassword, userId], async (err, result) => {
        if (err) {
          console.error("Error resetting password:", err);
          return res.status(500).json({ message: "Failed to reset password" });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Send password reset email
        const emailSent = await sendPasswordResetEmail(user.email, user.name, password);
        
        logActivity(req.user.id, "RESET_PASSWORD", "SUCCESS", `Reset password for user ID: ${userId}, Email sent: ${emailSent}`);
        
        res.json({ 
          message: emailSent 
            ? "Password reset successfully. New credentials sent via email." 
            : "Password reset successfully but email notification failed."
        });
      });
      
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= GET ALL USERS =================
router.get(
  "/users",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {
    const sql = `
      SELECT id, name, email, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json(results);
    });
  }
);

// ================= DELETE USER =================
router.delete(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    const sql = "DELETE FROM users WHERE id = ?";
    
    db.query(sql, [userId], (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        logActivity(req.user.id, "DELETE_USER", "FAILED", `Failed to delete user ID: ${userId}`);
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logActivity(req.user.id, "DELETE_USER", "SUCCESS", `Deleted user ID: ${userId}`);
      
      res.json({ message: "User deleted successfully" });
    });
  }
);

// ================= UPDATE USER ROLE =================
router.put(
  "/users/:id/role",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!["admin", "officer", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // Prevent admin from changing their own role
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }
    
    const sql = "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?";
    
    db.query(sql, [role, userId], (err, result) => {
      if (err) {
        console.error("Error updating role:", err);
        return res.status(500).json({ message: "Failed to update role" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      logActivity(req.user.id, "UPDATE_USER_ROLE", "SUCCESS", `Updated user ID: ${userId} to role: ${role}`);
      
      res.json({ message: "User role updated successfully" });
    });
  }
);

// ================= GET USER BY ID =================
router.get(
  "/users/:id",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {
    const userId = req.params.id;
    
    const sql = "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?";
    
    db.query(sql, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(results[0]);
    });
  }
);

module.exports = router;