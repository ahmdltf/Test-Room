import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

/* app.get('/', (req, res) => {
    res.status(200).send('<h1>Server Gemini Chatbot API Berjalan!</h1>');
}); */

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(messages)) throw new Error('Messages must be an array!');

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents
        });

        res.status(200).json({ result: response.text });
    }   catch (e) {
        res.status(500).json({ error: e.message });
    }
});