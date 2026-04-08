const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers["authorization"];

  console.log("Auth Middleware - Authorization header:", authHeader);

  if (!authHeader) {
    console.log("Auth Middleware - No token provided");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Extract token - remove "Bearer " prefix if present
  let token;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log("Auth Middleware - Extracted Bearer token");
  } else {
    token = authHeader;
    console.log("Auth Middleware - Using raw token");
  }

  if (!token) {
    console.log("Auth Middleware - No token after extraction");
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  try {
    // Use the SAME secret as in auth.js
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    const decoded = jwt.verify(token, secret);
    console.log("Auth Middleware - Token verified for user ID:", decoded.id, "Role:", decoded.role);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Auth Middleware - Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;