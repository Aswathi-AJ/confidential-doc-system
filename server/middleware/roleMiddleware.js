const logActivity = require("../utils/logger");

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {

      // 🔥 Log failed attempt
      logActivity(req.user.id, "ROLE_VIOLATION", "FAILED");

      return res.status(403).json({
        message: "Access denied: insufficient role"
      });
    }

    next();
  };
};

module.exports = checkRole;