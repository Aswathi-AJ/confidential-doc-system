const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { encryptData, decryptData } = require("../utils/crypto");
const router = express.Router();
const logActivity = require("../utils/logger");
const { normalizeToHex } = require("../utils/helper");

const normalizeToHex = (value) => {
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (typeof value === "string") {
    // If it's already a hex string, return as-is.
    if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) {
      return value;
    }
    return Buffer.from(value, "binary").toString("hex");
  }
  return value;
};

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
// Handle file size error
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 5MB"
    });
  }
  next(err);
});

// ================= UPLOAD =================
router.post(
  "/upload",
  verifyToken,
  checkRole(["admin", "officer"]),
  upload.single("file"),
  (req, res) => {

    // ❌ No file
    if (!req.file) {
      logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 🔐 File type validation (FIXED POSITION)
    const allowedTypes = ["application/pdf"];

    if (!allowedTypes.includes(req.file.mimetype)) {

      // delete uploaded wrong file
      fs.unlinkSync(req.file.path);

      logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");

      return res.status(400).json({
        message: "Only PDF files are allowed"
      });
    }

    const filePath = path.join(__dirname, "../uploads", req.file.filename);

    const fileData = fs.readFileSync(filePath);
    const encrypted = encryptData(fileData);
    const backupEncrypted = encryptData(fileData); // backup 

    const sql = `
    INSERT INTO documents 
    (filename, encrypted_data, backup_data, encrypted_dek, iv, auth_tag, backup_key, backup_iv, backup_auth_tag, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    

    db.query(
      sql,
      [
        req.file.originalname,
        encrypted.encryptedData,//main
        Buffer.from(backupEncrypted.encryptedData, 'hex'), // Convert hex to binary
        encrypted.key,          // main key
        encrypted.iv,
        encrypted.authTag,
        Buffer.from(backupEncrypted.key, 'hex'),          // Convert hex to binary
        Buffer.from(backupEncrypted.iv, 'hex'),           // Convert hex to binary
        Buffer.from(backupEncrypted.authTag, 'hex'),      // Convert hex to binary
        
        req.user.id
      ],
      
      (err, result) => {

        if (err) {
          logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
          return res.status(500).json(err);
        }

        fs.unlinkSync(filePath);

        logActivity(req.user.id, "UPLOAD_DOCUMENT", "SUCCESS");

        res.json({
          message: "File encrypted and stored securely"
        });

      }
    );
  }
);


// ================= LIST =================
router.get(
  "/list",
  verifyToken,
  checkRole(["admin", "officer", "viewer"]),
  (req, res) => {

    const userId = req.user.id;
    const userRole = req.user.role;
    const filterUserId = req.query.userId;

    let sql;
    let values = [];

    if (userRole === "admin") {
      if (filterUserId) {
        sql = "SELECT id, filename, uploaded_by, created_at FROM documents WHERE uploaded_by = ?";
        values = [filterUserId];
      } else {
        sql = "SELECT id, filename, uploaded_by, created_at FROM documents";
      }
    } else {
      sql = "SELECT id, filename, uploaded_by, created_at FROM documents WHERE uploaded_by = ?";
      values = [userId];
    }

    db.query(sql, values, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
  }
);


// ================= DOWNLOAD =================
router.get(
  "/download/:id",
  verifyToken,
  checkRole(["admin", "officer", "viewer"]),
  (req, res) => {

    const docId = req.params.id;
    const sql = "SELECT * FROM documents WHERE id = ?";

    db.query(sql, [docId], (err, results) => {

      if (err) {
        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "FAILED");
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "FAILED");
        return res.status(404).json({ message: "Document not found" });
      }

      const doc = results[0];

// 🔐 Ownership check FIRST
if (
  req.user.role !== "admin" &&
  Number(doc.uploaded_by) !== Number(req.user.id)
) {
  logActivity(req.user.id, "UNAUTHORIZED_DOCUMENT_ACCESS", "FAILED");

  return res.status(403).json({
    message: "Access denied - You can only access your own documents"
  });
}

try {
  const decryptedData = decryptData(
    doc.encrypted_data,
    doc.encrypted_dek,
    doc.iv,
    doc.auth_tag
  );

  logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "SUCCESS");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.filename}"`
  );

  res.send(decryptedData);

} catch (err) {

  console.error("Tampering detected:", err.message);
  console.log("🔄 Attempting recovery from backup...");

  try {

    const recoveredData = decryptData(
      normalizeToHex(doc.backup_data),
      normalizeToHex(doc.backup_key),
      normalizeToHex(doc.backup_iv),
      normalizeToHex(doc.backup_auth_tag)
    );

    logActivity(req.user.id, "RECOVERY_SUCCESS", "SUCCESS");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.filename}"`
    );

    return res.send(recoveredData);

  } catch (recoveryErr) {

    console.error("Recovery failed:", recoveryErr.message);

    logActivity(req.user.id, "RECOVERY_FAILED", "FAILED");

    return res.status(400).json({
      message: "Data corrupted and cannot be recovered"
    });
  }
}

    });
  }
);


// ================= DELETE =================
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {

    const docId = req.params.id;
    const sql = "DELETE FROM documents WHERE id = ?";

    db.query(sql, [docId], (err, result) => {

      if (err) {
        logActivity(req.user.id, "DELETE_DOCUMENT", "FAILED");
        return res.status(500).json(err);
      }

      if (result.affectedRows === 0) {
        logActivity(req.user.id, "DELETE_DOCUMENT", "FAILED");
        return res.status(404).json({ message: "Document not found" });
      }

      logActivity(req.user.id, "DELETE_DOCUMENT", "SUCCESS");

      res.json({ message: "Document deleted successfully" });

    });
  }
);

// ================= VIEW LOGS (ADMIN) =================
router.get(
  "/logs",
  verifyToken,
  checkRole(["admin"]),
  (req, res) => {

    const sql = "SELECT * FROM logs ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(results);
    });

  }
);
module.exports = router;