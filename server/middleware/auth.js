const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function requireLogin(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, SECRET);
        req.userId = payload.id;
        next();
    } catch (error) {
        res.status(401).json({ error: "Please log in" });
    }
}

module.exports = { requireLogin, SECRET };