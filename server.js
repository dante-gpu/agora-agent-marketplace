const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 8787;

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(bodyParser.json());

/** IMAGE - Stability.ai */
app.post('/api/hf-image', async (req, res) => {
  const prompt = req.body.inputs;
  console.log('[proxy] Received prompt:', prompt);

  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: 'image/*',
        },
        responseType: 'arraybuffer',
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    const errText = error?.response?.data?.toString?.('utf8') || error.message;
    console.error('[proxy] Stability API error:', errText);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

/** TEXT - Gemini */
app.post('/api/gemini', async (req, res) => {
  const prompt = req.body.prompt;
  console.log('[proxy] Gemini prompt received:', prompt);

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: GEMINI_API_KEY,
        },
      }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    res.json({ result });
  } catch (error) {
    console.error('[proxy] Gemini API error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Gemini generation failed', detail: error?.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`[proxy] Stability + Gemini proxy listening at http://localhost:${PORT}`);
});
