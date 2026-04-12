const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const db = require("../config/db");
const fs = require("fs").promises; // Changed to promises version
const path = require("path");
const { encryptData, decryptData } = require("../utils/crypto");
const router = express.Router();
const logActivity = require("../utils/logger");
const { normalizeToHex } = require("../utils/helper");
const { saveBackup, restoreBackup, deleteBackup } = require("../utils/backupService"); // ADD THIS

// Memory storage instead of disk storage (better for encryption)
const storage = multer.memoryStorage(); // CHANGED: Use memory storage

// Multer config - 50MB limit
const upload = multer({
  storage, // CHANGED: Use memory storage
  limits: { 
    fileSize: 50 * 1024 * 1024
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
  async (req, res) => {
    try {
      if (!req.file) {
        logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
        return res.status(400).json({ message: "No file uploaded" });
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain"
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
        return res.status(400).json({
          message: "File type not allowed. Allowed: PDF, JPG, PNG, TXT"
        });
      }

      const fileData = req.file.buffer;
      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      
      console.log(`Uploading: ${req.file.originalname}, Size: ${fileSizeMB}MB, Type: ${req.file.mimetype}`);
      
      const encrypted = encryptData(fileData);
      
      let backupPath = null;
      if (process.env.BACKUP_ENABLED === 'true') {
        backupPath = await saveBackup(null, fileData);
        console.log("Backup saved to:", backupPath);
      }

      const sql = `
        INSERT INTO documents 
        (filename, encrypted_data, encrypted_dek, iv, auth_tag, 
         backup_location, uploaded_by, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Use callback style (compatible with your existing db)
      db.query(sql, [
        req.file.originalname,
        encrypted.encryptedData,
        encrypted.key,
        encrypted.iv,
        encrypted.authTag,
        backupPath,
        req.user.id,
        req.file.size,
        req.file.mimetype
      ], async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
          return res.status(500).json({ message: "Database error" });
        }

        // Update backup filename with actual document ID
        if (backupPath && result.insertId) {
          const newBackupPath = backupPath.replace('_null_', `_${result.insertId}_`);
          try {
            await fs.rename(backupPath, newBackupPath);
            db.query("UPDATE documents SET backup_location = ? WHERE id = ?", [newBackupPath, result.insertId]);
          } catch (renameErr) {
            console.error("Failed to rename backup:", renameErr.message);
          }
        }

        logActivity(req.user.id, "UPLOAD_DOCUMENT", "SUCCESS");

        res.json({
          message: "File encrypted and stored securely",
          fileInfo: {
            name: req.file.originalname,
            size: `${fileSizeMB}MB`,
            type: req.file.mimetype
          }
        });
      });

    } catch (error) {
      console.error("Upload error:", error);
      logActivity(req.user.id, "UPLOAD_DOCUMENT", "FAILED");
      res.status(500).json({ message: "Upload failed", error: error.message });
    }
  }
);

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
  async (req, res) => { // CHANGED: Made async
    const docId = req.params.id;
    console.log("Download requested for ID:", docId);
    
    const sql = "SELECT * FROM documents WHERE id = ?";

    db.query(sql, [docId], async (err, results) => { // CHANGED: Added async
      if (err) {
        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "FAILED");
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "FAILED");
        return res.status(404).json({ message: "Document not found" });
      }

      const doc = results[0];
      console.log("Document:", doc.filename);

      // Try primary decryption first
      try {
        const decryptedData = decryptData(
          doc.encrypted_data,
          doc.encrypted_dek,
          doc.iv,
          doc.auth_tag
        );

        console.log("Primary decryption SUCCESS");
        logActivity(req.user.id, "DOWNLOAD_DOCUMENT", "SUCCESS");
        const contentType = doc.mime_type || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${doc.filename}"`
        );
        return res.send(decryptedData);

      } catch (primaryErr) {
        // Primary failed - try backup recovery
        console.log("Primary decryption FAILED:", primaryErr.message);
        console.log("Attempting backup recovery...");
        
        logActivity(req.user.id, "TAMPER_DETECTED", "WARNING", `Document ID: ${docId}, File: ${doc.filename}`);

        // NEW: Try file system backup first
        if (doc.backup_location && process.env.BACKUP_ENABLED === 'true') {
          try {
            console.log("Attempting recovery from file system backup:", doc.backup_location);
            const recoveredData = await restoreBackup(doc.backup_location);
            
            console.log("File system backup recovery SUCCESS!");
            logActivity(req.user.id, "RECOVERY_SUCCESS", "SUCCESS", `Document recovered from external backup: ${doc.filename}`);

            const contentType = doc.mime_type || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${doc.filename}"`
            );
            return res.send(recoveredData);

          } catch (backupErr) {
            console.error("File system backup recovery FAILED:", backupErr.message);
          }
        }

        // FALLBACK: Try legacy backup (for old documents that still have backup_data)
        if (doc.backup_data && doc.backup_data.length > 0) {
          try {
            console.log("Attempting recovery from legacy backup in database");
            const recoveredData = decryptData(
              normalizeToHex(doc.backup_data),
              normalizeToHex(doc.backup_key),
              normalizeToHex(doc.backup_iv),
              normalizeToHex(doc.backup_auth_tag)
            );

            console.log("Legacy backup recovery SUCCESS!");
            logActivity(req.user.id, "RECOVERY_SUCCESS_LEGACY", "SUCCESS", `Document recovered from legacy backup: ${doc.filename}`);

            const contentType = doc.mime_type || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${doc.filename}"`
            );
            return res.send(recoveredData);

          } catch (legacyErr) {
            console.error("Legacy backup recovery FAILED:", legacyErr.message);
          }
        }

        logActivity(req.user.id, "RECOVERY_FAILED", "CRITICAL", `Document ID: ${docId}`);
        return res.status(400).json({
          message: "Document corrupted and cannot be recovered"
        });
      }
    });
  }
);

// ================= DELETE =================
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => { // CHANGED: Made async
    const docId = req.params.id;
    
    // NEW: Get backup location before deleting
    const getBackupSql = "SELECT backup_location FROM documents WHERE id = ?";
    db.query(getBackupSql, [docId], async (err, results) => {
      if (err) return res.status(500).json(err);
      
      const backupLocation = results[0]?.backup_location;
      
      // Delete from database
      const sql = "DELETE FROM documents WHERE id = ?";
      db.query(sql, [docId], async (err, result) => {
        if (err) {
          logActivity(req.user.id, "DELETE_DOCUMENT", "FAILED");
          return res.status(500).json(err);
        }

        if (result.affectedRows === 0) {
          logActivity(req.user.id, "DELETE_DOCUMENT", "FAILED");
          return res.status(404).json({ message: "Document not found" });
        }

        // NEW: Delete backup file if it exists
        if (backupLocation && process.env.BACKUP_ENABLED === 'true') {
          try {
            await deleteBackup(backupLocation);
            console.log("Backup file deleted:", backupLocation);
          } catch (backupErr) {
            console.error("Failed to delete backup file:", backupErr.message);
            // Don't fail the request, just log the error
          }
        }

        logActivity(req.user.id, "DELETE_DOCUMENT", "SUCCESS");
        res.json({ message: "Document deleted successfully" });
      });
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