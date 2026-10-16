const express = require("express");
const { pool } = require("../db");

const router = express.Router();

const categories = ["Food", "Transport", "Bills"];

function validateExpense(body) {
    const title = String(body.title || "").trim();
    const amount = Number(body.amount);

    if (title === "") return "Title is required";
    if (title.length > 50) return "Title is too long (max 50 characters)";
    if (!Number.isFinite(amount) || amount <= 0) {
        return "Amount must be a number greater than 0";
    }
    return null;
}

router.get("/", async function (req, res) {
    const result = await pool.query(
        "SELECT id, title, amount, category FROM expenses WHERE user_id = $1 ORDER BY id",
        [req.userId]
    );
    res.json(result.rows);
});

router.post("/", async function (req, res) {
    const error = validateExpense(req.body);
    if (error) {
        return res.status(400).json({ error: error });
    }

    if (!categories.includes(req.body.category)) {
        return res.status(400).json({ error: "Invalid category" });
    }

    const title = req.body.title.trim();
    const amount = Number(req.body.amount);
    const category = req.body.category;

    const result = await pool.query(
        "INSERT INTO expenses (user_id, title, amount, category) VALUES ($1, $2, $3, $4) RETURNING id, title, amount, category",
        [req.userId, title, amount, category]
    );

    res.status(201).json(result.rows[0]);
});

router.put("/:id", async function (req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const error = validateExpense(req.body);
    if (error) {
        return res.status(400).json({ error: error });
    }

    const result = await pool.query(
        "UPDATE expenses SET title = $1, amount = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, amount, category",
        [req.body.title.trim(), Number(req.body.amount), id, req.userId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: "Not Found" });
    }

    res.json(result.rows[0]);
});

router.delete("/:id", async function (req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const result = await pool.query(
    "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
    [id, req.userId]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: "Not found" });
    }
 
    res.json({ message: "Deleted"});
});

module.exports = router;