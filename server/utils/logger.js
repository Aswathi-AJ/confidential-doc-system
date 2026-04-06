const db = require("../config/db");

const logActivity = (userId, action, status) => {
  const sql = "INSERT INTO logs (user_id, action, status) VALUES (?, ?, ?)";

  db.query(sql, [userId, action, status], (err) => {
    if (err) {
      console.error("Logging error:", err);
      return;
    }

    // 🚨 Check suspicious activity (3 failed attempts)
    if (status === "FAILED") {
      const checkSql = `
        SELECT COUNT(*) AS count 
        FROM logs 
        WHERE user_id = ? AND status = 'FAILED' 
        AND created_at > NOW() - INTERVAL 5 MINUTE
      `;

      db.query(checkSql, [userId], (err, results) => {
        if (err) return;

        if (results[0].count >= 3) {
          console.log("🚨 Suspicious activity detected for user:", userId);
        }
      });
    }
  });
};

module.exports = logActivity;