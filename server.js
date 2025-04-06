require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// POST route for TTS
app.post("/api/tts", async (req, res) => {
  const {
    text,
    voice_code = "en-US-1",
    speed = "1.00",
    pitch = "1.00",
  } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    return res
      .status(400)
      .json({ error: "Text is required and must be a non-empty string." });
  }

  const cleanText = text.replace(/[^\w\s.,!?]/g, "");

  const encodedParams = new URLSearchParams();
  encodedParams.set("voice_code", voice_code);
  encodedParams.set("text", cleanText);
  encodedParams.set("speed", speed);
  encodedParams.set("pitch", pitch);
  encodedParams.set("output_type", "audio_url");

  const options = {
    method: "POST",
    url: "https://cloudlabs-text-to-speech.p.rapidapi.com/synthesize",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "cloudlabs-text-to-speech.p.rapidapi.com",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: encodedParams,
  };

  try {
    const response = await axios.request(options);
    const data = response.data;

    console.log("TTS API response:", data);

    // Handle CloudLabs response structure
    if (data.status === "processing" && data.url) {
      res.json({
        status: "processing",
        url: data.url,
        id: data.id || null,
      });
    } else if (data.result?.audio_url) {
      // Key fix here
      res.json({
        status: "done",
        audio_url: data.result.audio_url,
      });
    } else {
      res.status(500).json({ error: "API returned no usable audio or URL." });
    }
  } catch (error) {
    console.error(" API ERROR:", error.response?.data || error.message);
    res
      .status(500)
      .json({ error: "TTS conversion failed. Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
