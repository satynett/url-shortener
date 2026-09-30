const db = require("./db/database");
const express = require("express");

const app = express();
const PORT = 3000;

const crypto = require("crypto");
function generateCode() {
  return crypto.randomBytes(4).toString("hex");
}

app.use(express.json());

app.get("/", (req, res) => {
  res.send("URL Shortener API is running!");
});

app.post("/test", (req, res) => {
  res.json(req.body);
});



const urls = {};


app.post("/api/urls", (req, res) => {
  const originalUrl = req.body?.url;

  if (typeof originalUrl !== "string" || !originalUrl.trim()) {
    return res.status(400).json({ error: "URL is required" });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({
      error: "Only HTTP and HTTPS URLs are allowed"
    });
  }

  const shortCode = generateCode();
  db.prepare(
  "INSERT INTO urls (short_code, original_url) VALUES (?, ?)"
  ).run(shortCode, parsedUrl.href);

  res.status(201).json({
    shortCode,
    shortUrl: `http://localhost:3000/${shortCode}`
  });
});






app.get("/:shortCode", (req, res) => {
  const shortCode = req.params.shortCode;

  const row = db.prepare(
    "SELECT original_url FROM urls WHERE short_code = ?"
  ).get(shortCode);

  if (!row) {
    return res.status(404).send("Short URL not found");
  }

  res.redirect(row.original_url);
});







app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});