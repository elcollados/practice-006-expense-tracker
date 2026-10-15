const express = require("express");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const { requireLogin } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRouter );
app.use("/api/expenses", requireLogin, expensesRouter);

app.listen(PORT, function () {
  console.log("Server running at http://localhost:" + PORT);
});