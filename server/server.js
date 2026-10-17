const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const { requireLogin } = require("./middleware/auth");
const { setupDatabase } = require("./db")

if (process.env.RENDER && !process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://api.frankfurter.dev"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null
      }
    }
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.static("public")); 

const apiLimiter = rateLimit({
  windowMs: 15 * 60 *1000,
  limit:300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many request, try again later" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many failed attempts, try again in 15 minutes" }
});

app.get("/api/my-ip", function (req, res) {
  res.json({ ip: req.ip, forwarded: req.headers["x-forwarded-for"] });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRouter );
app.use("/api/expenses", requireLogin, expensesRouter);

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