const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
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

// Upload document
router.post("/upload", verifyToken, upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "../uploads", req.file.filename);

  // read file
  const fileData = fs.readFileSync(filePath);

  // encrypt file
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
router.get("/download/:id", verifyToken, (req, res) => {

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

  });

});

module.exports = router;

