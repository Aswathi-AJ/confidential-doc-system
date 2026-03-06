const crypto = require("crypto");

function encryptData(data) {

  const key = crypto.randomBytes(32); // AES-256 key
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString("hex"),
    key: key.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

function decryptData(encryptedData, key, iv, authTag) {

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final()
  ]);

  return decrypted;
}

module.exports = { encryptData, decryptData };