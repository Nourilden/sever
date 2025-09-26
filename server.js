require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/fix", async (req, res) => {
  try {
    console.log("API Key:", process.env.OPENROUTER_API_KEY ? "Present" : "Missing");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    console.log("API Response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("API Error:", errorText);
      return res.status(response.status).json({ error: "API Error", details: errorText });
    }

    // stream response back (إذا الـ API بيرجع Stream)
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      res.end();
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Fixly API server is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
