// Check required environment variables on startup
const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'BACKUP_MASTER_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(' Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
} else {
  console.log('All environment variables are set');
}