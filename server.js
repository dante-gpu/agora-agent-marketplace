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
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GROK2_API_KEY = process.env.GROK2_API_KEY;

if (!DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY is not set in .env');
  process.exit(1);
}
if (!GROK2_API_KEY) {
  console.error('Error: GROK2_API_KEY is not set in .env');
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());

app.post('/api/hf-image', async (req, res) => {
  const prompt = req.body.inputs;
  console.log('[proxy] Stability image prompt:', prompt);
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
  } catch (err) {
    console.error('[proxy] Stability API error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

app.post('/api/gemini', async (req, res) => {
  const { prompt, systemPrompt } = req.body;
  console.log('[proxy] Gemini prompt received:', prompt);
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  const parts = [];
  if (systemPrompt) parts.push({ text: `[SYSTEM]: ${systemPrompt}` });
  parts.push({ text: prompt });
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent',
      { contents: [{ parts }] },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: GEMINI_API_KEY },
      }
    );
    const result = response.data.candidates && response.data.candidates[0].content.parts[0].text;
    res.json({ result: result || 'No response from Gemini.' });
  } catch (err) {
    console.error('[proxy] Gemini API error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Gemini generation failed', detail: err.response ? err.response.data : err.message });
  }
});

app.post('/api/deepseek', async (req, res) => {
  const prompt = req.body.prompt;
  console.log('[proxy] Deepseek prompt received:', prompt);
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  try {
    const dsResponse = await axios.post(
      'https://api.deepseek.ai/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const text = dsResponse.data.choices && dsResponse.data.choices[0].message.content;
    if (text) {
      res.json({ result: text });
    } else {
      console.warn('[proxy] Deepseek empty chat response:', dsResponse.data);
      res.status(502).json({ error: 'Deepseek returned no content', detail: dsResponse.data });
    }
  } catch (err) {
    console.error('[proxy] Deepseek chat error:', err.response ? err.response.data : err.message);
    res.status(err.response ? err.response.status : 500).json({ error: 'Deepseek chat failed', detail: err.response ? err.response.data : err.message });
  }
});

app.post('/api/grok2', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const apiRes = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-1212',
        messages: [
          { role: 'system', content: 'You are Grok-2, a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK2_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = apiRes.data.choices?.[0]?.message?.content;
    if (text) return res.json({ result: text });
    return res.status(502).json({ error: 'No content', detail: apiRes.data });
  } catch (err) {
    console.error('[proxy] Grok-2 API error:', err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: 'Grok-2 integration failed', detail: err.response?.data || err.message });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`[proxy] Stability + Gemini + Deepseek + Grok-2 proxy listening at http://localhost:${PORT}`);
});
