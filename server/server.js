const express = require("express");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const { requireLogin } = require("./middleware/auth");
const { setupDatabase } = require("./db")

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRouter );
app.use("/api/expenses", requireLogin, expensesRouter);

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

setupDatabase()
  .then(function () {
    app.listen(PORT, function () {
      console.log("Server running at http://localhost:" + PORT);
    });
  })
  .catch(function (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  });