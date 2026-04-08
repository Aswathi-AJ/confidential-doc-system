const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/document");
const userManagementRoutes = require("./routes/userManagement");
const app = express();

app.use(cors());
app.use(express.json());   

app.use("/api/auth", authRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/admin", userManagementRoutes);
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
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