import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(path.dirname(__filename), 'public')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Invalid conversation format');
    const contents = conversation.map(({ role, content }) => ({
        role,
        parts: [{ text: content }]
    }));

    // Use the older API structure which seems to match your installed package version
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    // Check if the error is an API error with a status code, specifically for rate limiting.
    if (e.status === 429) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    } else {
      res.status(500).json({ error: e.message || 'An internal server error occurred.'});
    }
  }
});