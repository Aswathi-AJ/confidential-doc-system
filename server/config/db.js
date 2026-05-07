const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

module.exports = db;