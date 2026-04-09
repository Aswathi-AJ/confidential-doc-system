const express = require("express");
const argon2 = require("argon2");
const crypto = require("crypto");
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const db = require("../config/db");
const router = express.Router();
const logActivity = require("../utils/logger");
const { sendSetupLinkEmail, sendPasswordResetLink } = require("../utils/mailer");

// ================= GET ALL USERS =================
router.get("/users", verifyToken, checkRole(["admin"]), (req, res) => {
  const sql = "SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// ================= CREATE NEW USER (SECURE - NO PASSWORD IN EMAIL) =================
router.post("/users", verifyToken, checkRole(["admin"]), async (req, res) => {
  const { name, email, role } = req.body;
  
  console.log("Creating user:", { name, email, role });
  
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
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
    
    // Generate temporary random password (will be hashed but user never sees it)
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const hashedPassword = await argon2.hash(tempPassword);
    
    // Generate setup token (expires in 24 hours)
    const setupToken = crypto.randomBytes(32).toString("hex");
    const setupExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const sql = `INSERT INTO users (name, email, password, role, setup_token, setup_expiry, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    
    db.query(sql, [name, email, hashedPassword, role, setupToken, setupExpiry], async (err, result) => {
      if (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ message: "Failed to create user" });
      }
      
      console.log("User created with ID:", result.insertId);
      
      // Send setup link email (NO PASSWORD in email!)
      const setupUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/setup-account?token=${setupToken}`;
      const emailSent = await sendSetupLinkEmail(email, name, setupUrl, role);
      
      logActivity(req.user.id, "CREATE_USER", "SUCCESS", `Created user: ${email} with role: ${role}, Setup email sent: ${emailSent}`);
      
      res.status(201).json({
        message: emailSent 
          ? "User created successfully. Setup link sent to email." 
          : "User created successfully but email notification failed.",
        user: { id: result.insertId, name, email, role }
      });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= RESET PASSWORD (WITH RESET LINK - NO PASSWORD IN EMAIL) =================
router.post("/users/:id/reset-password", verifyToken, checkRole(["admin"]), async (req, res) => {
  const userId = req.params.id;
  
  try {
    // Get user details first
    const getUserSql = "SELECT name, email FROM users WHERE id = ?";
    const user = await new Promise((resolve, reject) => {
      db.query(getUserSql, [userId], (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save reset token in database
    const updateSql = "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?";
    db.query(updateSql, [resetToken, resetExpiry, userId], async (err) => {
      if (err) return res.status(500).json({ message: "Failed to generate reset link" });
      
      // Send reset link email (NO PASSWORD in email!)
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
      const emailSent = await sendPasswordResetLink(user.email, user.name, resetUrl);
      
      logActivity(req.user.id, "RESET_PASSWORD", "SUCCESS", `Reset password for user ID: ${userId}, Email sent: ${emailSent}`);
      
      res.json({ 
        message: emailSent 
          ? "Password reset link sent to email. User will create new password." 
          : "Reset link generated but email notification failed."
      });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE USER =================
router.delete("/users/:id", verifyToken, checkRole(["admin"]), (req, res) => {
  const userId = req.params.id;
  
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to delete user" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    logActivity(req.user.id, "DELETE_USER", "SUCCESS", `Deleted user ID: ${userId}`);
    res.json({ message: "User deleted successfully" });
  });
});

// ================= UPDATE USER ROLE =================
router.put("/users/:id/role", verifyToken, checkRole(["admin"]), (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  
  if (!["admin", "officer", "viewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }
  
  const sql = "UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?";
  db.query(sql, [role, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to update role" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    logActivity(req.user.id, "UPDATE_USER_ROLE", "SUCCESS", `Updated user ID: ${userId} to role: ${role}`);
    res.json({ message: "User role updated successfully" });
  });
});

// ================= GET USER BY ID =================
router.get("/users/:id", verifyToken, checkRole(["admin"]), (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
});

module.exports = router;