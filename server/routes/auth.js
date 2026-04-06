const express = require("express");
const argon2 = require("argon2");
const db = require("../config/db");
const crypto = require("crypto");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const userRole ="viewer";
  try {
    const hashedPassword = await argon2.hash(password);

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, hashedPassword, userRole], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User registered successfully" });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const jwt = require("jsonwebtoken");

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    try {
      const validPassword = await argon2.verify(user.password, password);

      if (!validPassword) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        "SECRET_KEY",
        { expiresIn: "15m" }
      );

      res.json({
        message: "Login successful",
        token
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});



// ================= FORGOT PASSWORD =================
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], (err, results) => {

    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(400).json({
        message: "Email not registered"
      });
    }

    // 🔐 Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token in DB
    db.query(
      "UPDATE users SET reset_token = ? WHERE email = ?",
      [token, email]
    );

    // 🔗 Reset link (for demo)
    const link = `http://localhost:5000/api/auth/reset-password/${token}`;

    console.log("🔗 Reset Link:", link);

    res.json({
      message: "Password reset link generated (check console)"
    });

  });
});

// ================= RESET PASSWORD =================
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const token = req.params.token;

  const sql = "SELECT * FROM users WHERE reset_token = ?";

  db.query(sql, [token], async (err, results) => {

    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    try {
      const hashedPassword = await argon2.hash(password);

      db.query(
        "UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?",
        [hashedPassword, token]
      );

      res.json({
        message: "Password reset successful"
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  });
});

// ================= Change PASSWORD =================

router.post("/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const sql = "SELECT * FROM users WHERE id = ?";

  db.query(sql, [req.user.id], async (err, results) => {

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    const valid = await argon2.verify(user.password, oldPassword);

    if (!valid) {
      return res.status(400).json({
        message: "Old password is incorrect"
      });
    }

    const hashed = await argon2.hash(newPassword);

    db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, req.user.id]
    );

    res.json({
      message: "Password changed successfully"
    });

  });
});
module.exports = router;