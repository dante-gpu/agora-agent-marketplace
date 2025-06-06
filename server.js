require('dotenv').config();
require('dotenv').config();

const express    = require('express');
const axios      = require('axios');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { GoogleAuth }   = require('google-auth-library');

// basit admin yetkilendirme middleware'i
function authorize(requiredRole) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'];   // ya da JWT'den okuduğunuz alan
    if (userRole !== requiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

const app  = express();
const PORT = 8787;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const auth = new GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language'
  ]
});

const TOOL_MAP = {
  '/api/gemini':   'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '/api/deepseek': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '/api/grok2':    '99999999-8888-7777-6666-555555555555',
  '/api/claude':   '77777777-6666-5555-4444-333333333333',
  '/api/llm':      '22222222-3333-4444-5555-666666666666',
  '/api/hf-image': '33333333-4444-5555-6666-777777777777'
};

function reportLogger(req, res, next) {
  if (req.method !== 'POST') return next();
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId = req.headers['x-user-id'] || 'anonymous-user';
    const toolId   = TOOL_MAP[req.path] || null;
    const success  = res.statusCode < 400;
    const errorMsg = success ? null : res.statusMessage;

    console.log('[reportLogger] fired:', {
      path:   req.path,
      status: res.statusCode,
      output: res.locals.output
    });

    try {
      const { data, error } = await supabase
        .from('tool_reports')
        .insert([{
          tool_id:        toolId,
          user_id:        userId,
          input_payload:  req.body,
          output_payload: res.locals.output || {},
          duration_ms:    duration,
          success,
          error_msg:      errorMsg
        }]);

      if (error) {
        console.error('[reportLogger] insert error:', error);
      } else {
        console.log('[reportLogger] insert OK:', data);
      }

      const day = new Date().toISOString().split('T')[0];
      const { error: rpcErr } = await supabase.rpc('upsert_tool_metrics', {
        p_tool_id:         toolId,
        p_day:             day,
        p_calls:           1,
        p_avg_duration_ms: duration,
        p_success_count:   success ? 1 : 0,
        p_error_count:     success ? 0 : 1
      });
      if (rpcErr) console.error('[reportLogger] RPC error:', rpcErr);
    } catch (err) {
      console.error('[reportLogger] unexpected error:', err);
    }
  });

  next();
}

function usageLogger(req, res, next) {
  if (req.method !== 'POST') return next();

  const start = Date.now();
  console.log('[usageLogger] registered for path:', req.path);

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId  = req.headers['x-user-id'] || null;
    const toolId  = TOOL_MAP[req.path]      || null;

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
      if (error) {
        console.error('[usageLogger] insert error:', error);
      } else {
        console.log('[usageLogger] insert OK:', data);
      }
    } catch (err) {
      console.error('[usageLogger] unexpected error (insert):', err);
    }

    try {
      const { error } = await supabase
        .from('user_agent_history')
        .upsert(
          {
            user_id:            userId,
            agent_id:           toolId,
            total_interactions: 1,
            total_tokens:       duration,
            last_interaction:   new Date().toISOString(),
          },
          { onConflict: ['user_id','agent_id'] }
        );
      if (error) {
        console.error('[usageLogger] upsert error:', error);
      } else {
        console.log('[usageLogger] upsert OK:', { userId, agentId: toolId });
      }
    } catch (err) {
      console.error('[usageLogger] unexpected error (upsert):', err);
    }
  });

  next();
}

app.use(reportLogger);
app.use(usageLogger);
app.use(cors());
app.use(bodyParser.json());

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
    res.locals.output = { result };
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

    const text = apiRes.data.choices?.[0]?.message?.content || null;
    res.locals.output = { result: text };

    if (text) {
      return res.json({ result: text });
    } else {
      return res.status(502).json({ error: 'No content', detail: apiRes.data });
    }
  } catch (err) {
    console.error('[proxy] Grok-2 error:', err.response?.data || err.message);
    res.locals.output = { error: err.message };
    return res.status(err.response?.status || 500).json({ error: 'Grok-2 failed' });
  }
});

app.post('/api/claude', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  const apiKeys = [
    process.env.VITE_ANTHROPIC_KEY_1,
    process.env.VITE_ANTHROPIC_KEY_2,
    process.env.VITE_ANTHROPIC_KEY_3,
  ].filter(Boolean);

  for (const key of apiKeys) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/chat/completions',
        {
          model: 'claude-3-opus-20240229',
          max_tokens_to_sample: 1024,
          stop_sequences: ["\n\nHuman:"],
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
        },
        {
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      const reply = response.data.completions?.[0]?.data?.text;
      if (reply) {
        res.locals.output = { result: reply };
        return res.json({ result: reply });
      }
    } catch (err) {
      console.warn('[Claude Fallback]', err.response?.status, err.message);
      continue;
    }
  }

  res.status(500).json({ error: 'Claude request failed on all keys' });
});



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
          console.time('[AUDIT_AGENT_REQUEST]');
          result = (await axios.post(
            'https://api.io/v1/chat/completions',
            {
              model: 'audit-analys-agent',
              messages: [{ role: 'user', content: prompt }]
            },
            {
              headers: { Authorization: `Bearer ${IO_API_KEY}` },
              timeout: 4000
            }
          )).data.choices[0].message.content;
          console.timeEnd('[AUDIT_AGENT_REQUEST]');
        } catch (err) {
          console.warn('[AUDIT FALLBACK] Primary failed, using Gemini.', err.message);
          console.time('[AUDIT_AGENT_GEMINI_FALLBACK]');
          result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
            prompt,
            systemPrompt: 'You are a security auditor for smart contracts...'
          })).data.result;
          console.timeEnd('[AUDIT_AGENT_GEMINI_FALLBACK]');
        }
        break;

      case 'article-writer-agent':
        result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
          prompt,
          systemPrompt: 'You are a professional article writer. Write structured and informative articles.'
        })).data.result;
        break;

      case 'assistant':
        console.time('[ASSISTANT_AGENT]');
        result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
          prompt,
          systemPrompt: 'You are a helpful assistant who provides clear, concise, and useful answers.'
        })).data.result;
        console.timeEnd('[ASSISTANT_AGENT]');
        break;

      case 'gemini-1-5-pro':
      case 'gemini-2-0-flash':
      case 'app-creators':
        result = (await axios.post(`http://localhost:${PORT}/api/gemini`, {
          prompt,
          systemPrompt
        })).data.result;
        break;

      case 'deepseek-v3-fw':
        result = (await axios.post(`http://localhost:${PORT}/api/deepseek`, { prompt })).data.result;
        break;

      case 'grok-2':
        result = (await axios.post(`http://localhost:${PORT}/api/grok2`, { prompt })).data.result;
        break;

      default:
        return res.status(400).json({ error: `Unknown slug: ${slug}` });
    }

    res.json({ result });
  } catch (err) {
    console.error('[LLM Unified Error]', err.response?.data || err.message);
    res.status(500).json({ error: 'LLM proxy failed', detail: err.response?.data || err.message });
  }
});



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

app.get('/api/usage-history', authorize('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('user_agent_history')
    .select('*')
    .order('last_interaction', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PORT}`);
});
