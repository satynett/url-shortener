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







let shortCode;
let saved = false;

for (let attempt = 1; attempt <= 5; attempt++) {
  shortCode = generateCode();

  try {
    db.prepare(
      "INSERT INTO urls (short_code, original_url) VALUES (?, ?)"
    ).run(shortCode, parsedUrl.href);

    saved = true;
    break;
  } catch (error) {
    if (!error.message.includes("UNIQUE")) {
      throw error;
    }
  }
}

if (!saved) {
  return res.status(500).json({
    error: "Could not generate a unique short code"
  });
}





  res.status(201).json({
    shortCode,
    shortUrl: `http://localhost:3000/${shortCode}`
  });
});






app.get("/test-error", (req, res) => {
  throw new Error("This is a test database failure");
});


app.get("/:shortCode", (req, res) => {
  const shortCode = req.params.shortCode;

  const row = db.prepare(
    "SELECT original_url FROM urls WHERE short_code = ?"
  ).get(shortCode);

  if (!row) {
    return res.status(404).send("Short URL not found");
  }

  db.prepare(
    "UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?"
  ).run(shortCode);

  res.redirect(row.original_url);
});







app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal server error"
  });
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});