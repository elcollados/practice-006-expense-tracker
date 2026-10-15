const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async function (req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required" });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
        return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = db
        .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email, hash);

    res.status(201).json({ id: Number(result.lastInsertRowid), email: email });
});  

router.post("/login", async function (req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    const ok = user && (await bcrypt.compare(password, user.password_hash));

    if (!ok) {
        return res.status(401).json({ error: "Wrong email or password" });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
    res.json({ token: token });
});

module.exports = router;
