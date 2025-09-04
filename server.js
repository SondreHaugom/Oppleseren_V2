import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors()); // Tillat cross-origin requests
app.use(express.json());

// API-endepunkt for TTS
app.post("/api/tts", async (req, res) => {
  const { text, voice } = req.body;
  console.log("Mottatt forespørsel:", { text: text.substring(0, 50) + "...", voice });
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("FEIL: OPENAI_API_KEY mangler i .env-filen");
    return res.status(500).json({ error: "API-nøkkel mangler" });
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    console.log("Kaller OpenAI API...");
    const response = await openai.audio.speech.create({
      model: "tts-1", // Bruk tts-1 eller tts-1-hd modellen
      voice: voice || "alloy",
      input: text,
      response_format: "mp3"
    });

    console.log("OpenAI API svarte, konverterer til buffer...");
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Buffer opprettet, størrelse:", buffer.length, "bytes");
    res.set("Content-Type", "audio/mpeg");
    res.send(buffer);
    console.log("Lyddata sendt tilbake til klienten");
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "Kunne ikke generere tale: " + err.message });
  }
});

app.use(express.static(".")); // Server alle filer fra rotkatalogen

app.listen(3000, () => {
  console.log("Server kjører på http://localhost:3000");
});
