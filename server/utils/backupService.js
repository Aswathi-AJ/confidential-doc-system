const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BACKUP_MASTER_KEY = Buffer.from(process.env.BACKUP_MASTER_KEY, 'hex');
const BACKUP_STORAGE_PATH = process.env.BACKUP_STORAGE_PATH || './backups/';

// Ensure backup directory exists
const initBackupStorage = async () => {
  try {
    await fs.access(BACKUP_STORAGE_PATH);
  } catch {
    await fs.mkdir(BACKUP_STORAGE_PATH, { recursive: true });
    console.log('Backup directory created:', BACKUP_STORAGE_PATH);
  }
};

// Save backup to file system (returns file path)
const saveBackup = async (docId, fileData) => {
  await initBackupStorage();
  
  const backupFilename = `backup_${docId}_${Date.now()}.enc`;
  const backupPath = path.join(BACKUP_STORAGE_PATH, backupFilename);
  
  // Generate per-backup IV
  const iv = crypto.randomBytes(12);
  
  // Encrypt with backup master key (separate from primary key)
  const cipher = crypto.createCipheriv('aes-256-gcm', BACKUP_MASTER_KEY, iv);
  const encryptedBackup = Buffer.concat([cipher.update(fileData), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Store metadata alongside encrypted data
  const backupPackage = {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encryptedData: encryptedBackup.toString('base64'),
    originalSize: fileData.length,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeFile(backupPath, JSON.stringify(backupPackage));
  
  // Return ONLY the file path (keys never stored in DB)
  return backupPath;
};

// Restore backup from file system
const restoreBackup = async (backupPath) => {
  try {
    const backupData = await fs.readFile(backupPath, 'utf8');
    const backupPackage = JSON.parse(backupData);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      BACKUP_MASTER_KEY,
      Buffer.from(backupPackage.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(backupPackage.authTag, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(backupPackage.encryptedData, 'base64')),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    console.error('Backup restoration failed:', error.message);
    throw new Error('Backup recovery failed');
  }
};

// Delete backup file
const deleteBackup = async (backupPath) => {
  try {
    await fs.unlink(backupPath);
    console.log('Backup deleted:', backupPath);
  } catch (error) {
    console.error('Failed to delete backup:', error.message);
  }
};

// Verify backup integrity
const verifyBackup = async (backupPath) => {
  try {
    await fs.access(backupPath);
    return true;
  } catch {
    return false;
  }
};

module.exports = { saveBackup, restoreBackup, deleteBackup, verifyBackup, initBackupStorage };