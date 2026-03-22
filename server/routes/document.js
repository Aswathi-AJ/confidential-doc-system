const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { encryptData, decryptData } = require("../utils/crypto");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/upload",verifyToken,checkRole(["admin", "officer"]),upload.single("file"),(req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);


  const fileData = fs.readFileSync(filePath);
  const encrypted = encryptData(fileData);

  const sql = `
    INSERT INTO documents 
    (filename, encrypted_data, encrypted_dek, iv, auth_tag, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.file.originalname,
      encrypted.encryptedData,
      encrypted.key,
      encrypted.iv,
      encrypted.authTag,
      req.user.id
    ],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      // delete original file
      fs.unlinkSync(filePath);

      res.json({
        message: "File encrypted and stored securely"
      });

    }
  );

});

router.get("/list",verifyToken,checkRole(["admin", "officer", "viewer"]),(req, res) => {

    const userId = req.user.id;
    const userRole = req.user.role;
    const filterUserId = req.query.userId;

    let sql;
    let values = [];

    // 👑 Admin logic
    if (userRole === "admin") {

      if (filterUserId) {
        // Filter by specific user
        sql = "SELECT id, filename, uploaded_by, created_at FROM documents WHERE uploaded_by = ?";
        values = [filterUserId];
      } else {
        // All documents
        sql = "SELECT id, filename, uploaded_by, created_at FROM documents";
      }

    } else {
      // 👤 Normal users → only their docs
      sql = "SELECT id, filename, uploaded_by, created_at FROM documents WHERE uploaded_by = ?";
      values = [userId];
    }

    db.query(sql, values, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });

  }
);

router.get("/download/:id",verifyToken,checkRole(["admin", "officer", "viewer"]),(req, res) => {
  const docId = req.params.id;

  const sql = "SELECT * FROM documents WHERE id = ?";

  db.query(sql, [docId], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const doc = results[0];

    try {
  const decryptedData = decryptData(
    doc.encrypted_data,
    doc.encrypted_dek,
    doc.iv,
    doc.auth_tag
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.filename}"`
  );

  res.send(decryptedData);

} catch (err) {
  console.error("Tampering detected:", err.message);

  return res.status(400).json({
    message: "Integrity check failed - data tampered"
  });
}


  });

});

router.delete("/:id",verifyToken,checkRole(["admin"]),(req, res) => {

    const docId = req.params.id;
    const sql = "DELETE FROM documents WHERE id = ?";
    db.query(sql, [docId], (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ message: "Document deleted successfully" });

    });

  }
);
module.exports = router;

