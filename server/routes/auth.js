// auth.js
const express = require("express");
const argon2 = require("argon2");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authMiddleware"); // make sure this exists

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await argon2.hash(password);

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User registered successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ message: "User not found" });

    const user = results[0];

    try {
      const validPassword = await argon2.verify(user.password, password);
      if (!validPassword) return res.status(400).json({ message: "Invalid password" });

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

// NEW: Get logged-in user info
router.get("/me", verifyToken, (req, res) => {
  // verifyToken middleware attaches user info to req.user
  const userId = req.user.id;

  const sql = "SELECT id, name, email, role FROM users WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(results[0]); // send user data to frontend
  });
});

module.exports = router;