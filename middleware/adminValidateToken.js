const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");

const adminValidateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token is not found" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token is not found" });
    }

    const verifiedJwt = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const adminData = await Admin.findOne(
      {isDeleted: false,
        tokens: { $elemMatch: { $eq: token } },
      },
      { roles: 1, password: 1 }
    ).lean();

    if (!adminData) {
      return res.status(401).json({ message: "You are not authorized" });
    }

    req.user = adminData;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ message: "Invalid token, please re-login" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "Token expired, please re-login" });
    }

    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = adminValidateToken;
