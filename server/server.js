require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/document");
const userManagementRoutes = require("./routes/userManagement");
const app = express();

app.use(cors());
app.use(express.json());   

// ✅ FIXED: Changed from "/api/document" to "/api/documents"
app.use("/api/documents", documentRoutes);  // ← Added 's' to match frontend
app.use("/api/auth", authRoutes);
app.use("/api/admin", userManagementRoutes);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Available endpoints:");
  console.log("  POST   /api/auth/login");
  console.log("  POST   /api/documents/upload");
  console.log("  GET    /api/documents/list");
  console.log("  GET    /api/documents/download/:id");
  console.log("  DELETE /api/documents/:id");
  console.log("  GET    /api/admin/users");
  console.log("  POST   /api/admin/users");
});

const verifyToken = require("./middleware/authMiddleware");

app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

const checkRole = require("./middleware/roleMiddleware");

// Only admin can access this
app.get("/admin-only", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin" });
});