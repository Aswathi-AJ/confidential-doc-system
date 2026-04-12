// C:\1.Aswathi\sem 6 miniproj\confidential-doc-system\server\scripts\fullBackup.js
const mysql = require('mysql2');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { createWriteStream } = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKUP_ARCHIVE_PATH = process.env.FULL_BACKUP_PATH || './full_backups/';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'confidential_docs'
};

async function fullSystemBackup() {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  console.log(`[${new Date().toISOString()}] Starting full system backup...`);
  
  // Create backup directory
  await fs.mkdir(BACKUP_ARCHIVE_PATH, { recursive: true });
  
  const tempDir = path.join(BACKUP_ARCHIVE_PATH, `temp_backup_${timestamp}`);
  await fs.mkdir(tempDir, { recursive: true });
  
  try {
    // 1. Backup database
    console.log("Backing up database...");
    const connection = mysql.createConnection(DB_CONFIG);
    
    const documents = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM documents', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    const users = await new Promise((resolve, reject) => {
      connection.query('SELECT id, name, email, role, created_at FROM users', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    const logs = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 10000', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    await fs.writeFile(path.join(tempDir, 'documents.json'), JSON.stringify(documents, null, 2));
    await fs.writeFile(path.join(tempDir, 'users.json'), JSON.stringify(users, null, 2));
    await fs.writeFile(path.join(tempDir, 'logs.json'), JSON.stringify(logs, null, 2));
    
    connection.end();
    
    // 2. Backup file system backups (if any)
    console.log("Backing up encrypted backup files...");
    const backupStorage = process.env.BACKUP_STORAGE_PATH;
    if (backupStorage) {
      try {
        await fs.access(backupStorage);
        const backupFiles = await fs.readdir(backupStorage);
        const backupDir = path.join(tempDir, 'encrypted_backups');
        await fs.mkdir(backupDir, { recursive: true });
        
        for (const file of backupFiles) {
          if (file.endsWith('.enc')) {
            await fs.copyFile(path.join(backupStorage, file), path.join(backupDir, file));
          }
        }
        console.log(`Copied ${backupFiles.filter(f => f.endsWith('.enc')).length} backup files`);
      } catch (err) {
        console.log("No backup storage found or accessible");
      }
    }
    
    // 3. Create ZIP archive
    console.log("Creating ZIP archive...");
    const zipFileName = `full_backup_${dateStr}.zip`;
    const zipPath = path.join(BACKUP_ARCHIVE_PATH, zipFileName);
    
    await new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', resolve);
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });
    
    // 4. Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
    // 5. Delete backups older than 30 days
    console.log("Cleaning old backups...");
    const files = await fs.readdir(BACKUP_ARCHIVE_PATH);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      if (file.startsWith('full_backup_') && file.endsWith('.zip')) {
        const filePath = path.join(BACKUP_ARCHIVE_PATH, file);
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < thirtyDaysAgo) {
          await fs.unlink(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    }
    
    // 6. Get file size
    const stats = await fs.stat(zipPath);
    
    console.log(`✅ Full backup completed: ${zipFileName}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Logs: ${logs.length}`);
    
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    // Cleanup temp directory on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
    process.exit(1);
  }
}

// Run backup
fullSystemBackup();