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

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Updated multer config - Increased file size limit to 50MB for government documents
const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024  // 50MB limit (gov documents can be large)
  }
});

// Handle file size error
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 50MB"
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

    // No file
    if (!req.file) {
      logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Updated allowed file types for government documents
const allowedTypes = [
  "application/pdf",           // PDF documents - view inline
  "image/jpeg",                // JPEG images - view inline
  "image/png",                 // PNG images - view inline
  "text/plain"                 // Text files - view inline
];

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded wrong file
      fs.unlinkSync(req.file.path);
      logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
      return res.status(400).json({
        message: "File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPEG, PNG, ZIP, RAR"
      });
    }

    const filePath = path.join(__dirname, "../uploads", req.file.filename);
    const fileData = fs.readFileSync(filePath);
    
    // Get file size for logging
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`Uploading file: ${req.file.originalname}, Size: ${fileSizeMB}MB, Type: ${req.file.mimetype}`);
    
    const encrypted = encryptData(fileData);
    const backupEncrypted = encryptData(fileData); // backup 

    const sql = `
    INSERT INTO documents 
    (filename, encrypted_data, backup_data, encrypted_dek, iv, auth_tag, backup_key, backup_iv, backup_auth_tag, uploaded_by, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(
      sql,
      [
        req.file.originalname,
        encrypted.encryptedData,
        Buffer.from(backupEncrypted.encryptedData, 'hex'),
        encrypted.key,
        encrypted.iv,
        encrypted.authTag,
        Buffer.from(backupEncrypted.key, 'hex'),
        Buffer.from(backupEncrypted.iv, 'hex'),
        Buffer.from(backupEncrypted.authTag, 'hex'),
        req.user.id,
        req.file.size,
        req.file.mimetype
      ],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
          return res.status(500).json(err);
        }

        fs.unlinkSync(filePath);
        logActivity(req.user.id, "UPLOAD_DOCUMENT", "SUCCESS");

        res.json({
          message: "File encrypted and stored securely",
          fileInfo: {
            name: req.file.originalname,
            size: `${fileSizeMB}MB`,
            type: req.file.mimetype
          }
        });
      }
    );
  }
);

// ================= LIST =================
// ================= LIST =================
router.get(
  "/list",
  verifyToken,
  checkRole(["admin", "officer", "viewer"]),
  (req, res) => {
    const userRole = req.user.role;
    const filterUserId = req.query.userId;

    let sql;
    let values = [];

    if (userRole === "admin" && filterUserId) {
      // Admin filtering by specific user
      sql = `
        SELECT d.id, d.filename, d.created_at, d.file_size, d.mime_type,
               u.name as uploaded_by_name, u.role as uploaded_by_role
        FROM documents d
        JOIN users u ON d.uploaded_by = u.id
        WHERE d.uploaded_by = ?
        ORDER BY d.created_at DESC
      `;
      values = [filterUserId];
    } else {
      // All users see all documents with uploader info
      sql = `
        SELECT d.id, d.filename, d.created_at, d.file_size, d.mime_type,
               u.name as uploaded_by_name, u.role as uploaded_by_role
        FROM documents d
        JOIN users u ON d.uploaded_by = u.id
        ORDER BY d.created_at DESC
      `;
      values = [];
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

      // ✅ REMOVED ownership check - ALL authenticated users can download ALL documents
      // This is a government system where documents need to be shared

      try {
        const decryptedData = decryptData(
          doc.encrypted_data,
          doc.encrypted_dek,
          doc.iv,
          doc.auth_tag
        );

        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "SUCCESS");
        const contentType = doc.mime_type || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${doc.filename}"`
        );
        res.send(decryptedData);

      } catch (err) {
        console.error("TAMPER DETECTED:", err.message);
        logActivity(req.user.id, "TAMPER_DETECTED", "WARNING", `Document ID: ${docId}`);
        
        console.log("Attempting recovery from backup...");

        try {
          const recoveredData = decryptData(
            normalizeToHex(doc.backup_data),
            normalizeToHex(doc.backup_key),
            normalizeToHex(doc.backup_iv),
            normalizeToHex(doc.backup_auth_tag)
          );

          logActivity(req.user.id, "RECOVERY_SUCCESS", "SUCCESS", `Document recovered: ${doc.filename}`);

          const contentType = doc.mime_type || "application/octet-stream";
          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${doc.filename}"`
          );

          return res.send(recoveredData);

        } catch (recoveryErr) {
          console.error("RECOVERY FAILED:", recoveryErr.message);
          logActivity(req.user.id, "RECOVERY_FAILED", "CRITICAL", `Document ID: ${docId}`);
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