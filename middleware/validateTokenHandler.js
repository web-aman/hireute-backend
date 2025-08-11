const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const validateToken = async (req, res, next) => {
  try {
    let token;
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "Invalid or expired token. Please re-login." });
        }
        req.user = decoded.user;
        next();
      });
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = validateToken;
