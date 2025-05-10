// server.js
require('dotenv').config();

const express    = require('express');
const axios      = require('axios');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { GoogleAuth }   = require('google-auth-library');

const app  = express();
const PORT = 8787;

// ———————————————————————————————
// Supabase Client (RPC & Logging)
// ———————————————————————————————
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ———————————————————————————————
// OAuth2 Client (Service Account)
// ———————————————————————————————
const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language'
  ]
});

// ———————————————————————————————
// Usage Logger Middleware (inline)
// ———————————————————————————————
// Path → tool_id eşlemesi; kendi tools tablonuzdaki UUID’leri girin
const TOOL_MAP = {
  '/api/gemini':   'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '/api/deepseek': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '/api/grok2':    '99999999-8888-7777-6666-555555555555',
  '/api/llm':      '22222222-3333-4444-5555-666666666666',
  '/api/hf-image': '33333333-4444-5555-6666-777777777777'
};

function usageLogger(req, res, next) {
  // Only log POST requests to avoid logging analytics and summary GETs
  if (req.method !== 'POST') {
    return next();
  }

  const start = Date.now();
  console.log('[usageLogger] registered for path:', req.path);

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId = req.headers['x-user-id'] || null;
    const toolId = TOOL_MAP[req.path] || null;
    console.log('[usageLogger] finish event:', {
      userId,
      toolId,
      status: res.statusCode,
      duration,
    });

    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .insert([{
          user_id:     userId,
          tool_id:     toolId,
          invoked_at:  new Date().toISOString(),
          params:      req.body,
          duration_ms: duration,
          status:      res.statusCode < 400 ? 'success' : 'error',
          error_code:  res.statusCode < 400 ? null : `HTTP_${res.statusCode}`,
          source:      'api',
        }]);
      if (error) console.error('[usageLogger] insert error:', error);
      else       console.log('[usageLogger] insert OK:', data);
    } catch (err) {
      console.error('[usageLogger] unexpected error:', err);
    }
  });

  next();
}


// ———————————————————————————————
// Global Middleware
// ———————————————————————————————
app.use(usageLogger);
app.use(cors());
app.use(bodyParser.json());

// ———————————————————————————————
// Env Kontrolleri
// ———————————————————————————————
const {
  STABILITY_API_KEY,
  GEMINI_API_KEY,
  DEEPSEEK_API_KEY,
  GROK2_API_KEY,
  IO_API_KEY,
  GOOGLE_PROJECT_ID
} = process.env;

[ STABILITY_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, GROK2_API_KEY, IO_API_KEY, GOOGLE_PROJECT_ID ]
  .forEach((v, i) => {
    if (!v) {
      console.error(`Error: missing env var #${i}`);
      process.exit(1);
    }
  });

// ———————————————————————————————
// Stability Image Proxy
// ———————————————————————————————
app.post('/api/hf-image', async (req, res) => {
  const prompt = req.body.inputs;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  try {
    const FormData = require('form-data');
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
    console.error('[proxy] Stability API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// ———————————————————————————————
// Gemini Proxy (OAuth2 + Paid Tier Billing)
// ———————————————————————————————
app.post('/api/gemini', async (req, res) => {
  const { prompt, systemPrompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  const parts = [];
  if (systemPrompt) parts.push({ text: `[SYSTEM]: ${systemPrompt}` });
  parts.push({ text: prompt });

  try {
    const client = await auth.getClient();
    const url    = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent';
    const oauthRes = await client.request({
      url,
      method: 'POST',
      params: { key: GEMINI_API_KEY },
      headers: { 'X-Goog-User-Project': GOOGLE_PROJECT_ID },
      data: { contents: [{ parts }] }
    });

    const result = oauthRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ result: result || 'No response from Gemini.' });
  } catch (err) {
    const status = err.response?.status;
    const data   = err.response?.data;
    console.error('[proxy] Gemini API error:', { status, data, message: err.message });
    res.status(status || 500).json({
      error:      'Gemini generation failed',
      statusCode: status,
      detail:     data || err.message
    });
  }
});

// ———————————————————————————————
// Deepseek Proxy
// ———————————————————————————————
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
          { role: 'user',   content: prompt },
        ],
        stream: false,
      },
      { headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}` } }
    );

    const text = dsResponse.data.choices?.[0]?.message?.content;
    if (text) return res.json({ result: text });
    res.status(502).json({ error: 'Deepseek returned no content', detail: dsResponse.data });
  } catch (err) {
    console.error('[proxy] Deepseek error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Deepseek failed' });
  }
});

// ———————————————————————————————
// Grok-2 Proxy
// ———————————————————————————————
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
          { role: 'user',   content: prompt },
        ],
        stream: false,
      },
      { headers: { Authorization: `Bearer ${GROK2_API_KEY}` } }
    );

    const text = apiRes.data.choices?.[0]?.message?.content;
    if (text) return res.json({ result: text });
    res.status(502).json({ error: 'No content', detail: apiRes.data });
  } catch (err) {
    console.error('[proxy] Grok-2 error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Grok-2 failed' });
  }
});

// ———————————————————————————————
// Unified LLM Proxy (Tokenomics & Audit)
// ———————————————————————————————
app.post('/api/llm', async (req, res) => {
  const { slug, prompt, systemPrompt } = req.body;
  if (!slug || !prompt) return res.status(400).json({ error: 'Missing slug or prompt.' });

  try {
    let result;
    switch (slug) {
      case 'tokenomics-analys-agent':
        result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
          prompt,
          systemPrompt: 'You are a tokenomics analysis expert...'
        })).data.result;
        break;
      case 'audit-analys-agent':
        try {
          result = (await axios.post(
            'https://api.io/v1/chat/completions',
            { model:'audit-analys-agent', messages:[{ role:'user', content:prompt }] },
            { headers:{ Authorization:`Bearer ${IO_API_KEY}` }}
          )).data.choices[0].message.content;
        } catch {
          result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
            prompt,
            systemPrompt:'You are a security auditor for smart contracts...'
          })).data.result;
        }
        break;
      case 'gemini-1-5-pro':
      case 'gemini-2-0-flash':
      case 'app-creators':
        result = (await axios.post(`http://localhost:${PORT}/api/gemini`, { prompt, systemPrompt })).data.result;
        break;
      case 'deepseek-v3-fw':
        result = (await axios.post(`http://localhost:${PORT}/api/deepseek`, { prompt })).data.result;
        break;
      case 'grok-2':
        result = (await axios.post(`http://localhost:${PORT}/api/grok2`, { prompt })).data.result;
        break;
      default:
        return res.status(400).json({ error:`Unknown slug: ${slug}` });
    }
    res.json({ result });
  } catch (err) {
    console.error('[LLM Unified Error]', err.response?.data || err.message);
    res.status(500).json({ error:'LLM proxy failed', detail: err.response?.data || err.message });
  }
});

// ———————————————————————————————
// Provider Usage Summary Route (RPC)
// ———————————————————————————————
app.get('/api/providers/:providerId/tools/:toolId/usage', async (req, res) => {
  const { toolId } = req.params;
  const { from, to } = req.query;
  const { data, error } = await supabase.rpc('get_tool_daily_usage', {
    tid:        toolId,
    start_date: from,
    end_date:   to
  });
  if (error) return res.status(500).json({ error });
  res.json({ usage: data });
});

// ———————————————————————————————
// Start Server
// ———————————————————————————————
app.listen(PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PORT}`);
});
