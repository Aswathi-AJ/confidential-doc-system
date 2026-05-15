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

const dbEnvGroup1 = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const dbEnvGroup2 = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];

const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
const dbGroup1Missing = dbEnvGroup1.filter(varName => !process.env[varName]);
const dbGroup2Missing = dbEnvGroup2.filter(varName => !process.env[varName]);

const hasDbConfig = dbGroup1Missing.length === 0 || dbGroup2Missing.length === 0;
const missingVars = [...missingRequired];

if (!hasDbConfig) {
  missingVars.push('DB_HOST/DB_USER/DB_PASSWORD/DB_NAME or MYSQL_HOST/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE');
}

if (missingVars.length > 0) {
  console.error(' Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
} else {
  console.log('All environment variables are set');
}