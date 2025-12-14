import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});
const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.post('/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Invalid conversation format');
    const contents = conversation.map(({ role, text }) => ({
        role,
        content: [{ text }]
    }));
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents
    });

    res.status(200).json({ reply: response.choices[0].content.text });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }

