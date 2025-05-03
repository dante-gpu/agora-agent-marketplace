const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 8787;

// API keys
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY  = process.env.DEEPSEEK_API_KEY;
const GROK2_API_KEY     = process.env.GROK2_API_KEY;
const IO_API_KEY        = process.env.IO_API_KEY;

// Validate required keys
if (!STABILITY_API_KEY) {
  console.error('Error: STABILITY_API_KEY is not set in .env');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY is not set in .env');
  process.exit(1);
}
if (!GROK2_API_KEY) {
  console.error('Error: GROK2_API_KEY is not set in .env');
  process.exit(1);
}
if (!IO_API_KEY) {
  console.error('Error: IO_API_KEY is not set in .env');
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());

// Stability Image Proxy
app.post('/api/hf-image', async (req, res) => {
  const prompt = req.body.inputs;
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

// Gemini Proxy
app.post('/api/gemini', async (req, res) => {
  const { prompt, systemPrompt } = req.body;
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

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ result: result || 'No response from Gemini.' });
  } catch (err) {
    console.error('[proxy] Gemini API error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Gemini generation failed', detail: err.response ? err.response.data : err.message });
  }
});

// Deepseek Proxy
app.post('/api/deepseek', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const dsResponse = await axios.post(
      'https://api.deepseek.ai/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = dsResponse.data.choices?.[0]?.message?.content;
    if (text) return res.json({ result: text });
    console.warn('[proxy] Deepseek empty response:', dsResponse.data);
    res.status(502).json({ error: 'Deepseek returned no content', detail: dsResponse.data });
  } catch (err) {
    console.error('[proxy] Deepseek chat error:', err.response ? err.response.data : err.message);
    res.status(err.response?.status || 500).json({ error: 'Deepseek chat failed', detail: err.response?.data || err.message });
  }
});

// Grok-2 Proxy
app.post('/api/grok2', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const apiRes = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-1212',
        messages: [
          { role: 'system', content: 'You are Grok-2, a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${GROK2_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const text = apiRes.data.choices?.[0]?.message?.content;
    if (text) return res.json({ result: text });
    res.status(502).json({ error: 'No content', detail: apiRes.data });
  } catch (err) {
    console.error('[proxy] Grok-2 API error:', err.response ? err.response.data : err.message);
    res.status(err.response?.status || 500).json({ error: 'Grok-2 integration failed', detail: err.response?.data || err.message });
  }
});

// Unified LLM Proxy (incl. Tokenomics & Audit)
app.post('/api/llm', async (req, res) => {
  const { slug, prompt, systemPrompt } = req.body;
  if (!slug || !prompt) return res.status(400).json({ error: 'Missing slug or prompt.' });

  try {
    let result;

    switch (slug) {
      case 'tokenomics-analys-agent': {
        const gemRes = await axios.post(
          `http://localhost:${PORT}/api/gemini`,
          {
            prompt,
            systemPrompt: 'You are a tokenomics analysis expert. Analyze the provided tokenomics data in detail and provide actionable insights.',
          }
        );
        result = gemRes.data.result;
        break;
      }

      case 'audit-analys-agent': {
        try {
          const ioRes = await axios.post(
            'https://api.io/v1/chat/completions',
            { model: 'audit-analys-agent', messages: [{ role: 'user', content: prompt }] },
            { headers: { Authorization: `Bearer ${IO_API_KEY}`, 'Content-Type': 'application/json' } }
          );
          result = ioRes.data.choices?.[0]?.message?.content;
        } catch (err) {
          console.warn('[Audit] IO API failed, falling back to Gemini:', err.message || err);
          const gemRes = await axios.post(
            `http://localhost:${PORT}/api/gemini`,
            {
              prompt,
              systemPrompt: 'You are a security auditor for smart contracts. Analyze the code for vulnerabilities and recommend fixes.',
            }
          );
          result = gemRes.data.result;
        }
        break;
      }

      case 'gemini-1-5-pro':
      case 'gemini-2-0-flash':
      case 'app-creators': {
        const gemRes = await axios.post(
          `http://localhost:${PORT}/api/gemini`,
          { prompt, systemPrompt }
        );
        result = gemRes.data.result;
        break;
      }

      case 'deepseek-v3-fw': {
        const dsRes = await axios.post(
          `http://localhost:${PORT}/api/deepseek`,
          { prompt }
        );
        result = dsRes.data.result;
        break;
      }

      case 'grok-2': {
        const grokRes = await axios.post(
          `http://localhost:${PORT}/api/grok2`,
          { prompt }
        );
        result = grokRes.data.result;
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown slug: ${slug}` });
    }

    return res.json({ result: result ?? 'No content returned.' });
  } catch (err) {
    console.error('[LLM Unified Error]', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'LLM proxy failed', detail: err.response ? err.response.data : err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PORT}`);
});
