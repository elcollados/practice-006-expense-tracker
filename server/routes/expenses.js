const express = require("express");
const db = require("../db");

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

router.get("/", function (req, res) {
    const expenses = db
    .prepare("SELECT * FROM expenses WHERE user_id = ?")
    .all(req.userId);
    res.json(expenses);
});

router.post("/", function (req, res) {
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

    const result = db
        .prepare("INSERT INTO expenses (user_id, title, amount, category) VALUES (?, ?, ?, ?)")
        .run(req.userId, title, amount, category);

    res.status(201).json({
        id: Number(result.lastInsertRowid),
        title: title,
        amount: amount,
        category: category
    });
});

router.put("/:id", function (req, res) {
    const id = Number(req.params.id);

    const error = validateExpense(req.body);
    if (error) {
        return res.status(400).json({ error: error });
    }

    const result = db
        .prepare("UPDATE expenses SET title = ?, amount = ? WHERE id = ? AND user_id = ?")
        .run(req.body.title.trim(), Number(req.body.amount), id, req.userId);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Not Found" });
    }

    const expense = db
        .prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?")
        .get(id, req.userId);
    res.json(expense);
});

router.delete("/:id", function (req, res) {
    const id = Number(req.params.id);

    const result = db
    .prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?")
    .run(id, req.userId);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Not found" });
    }

    res.json({ message: "Deleted "});
});

module.exports = router;