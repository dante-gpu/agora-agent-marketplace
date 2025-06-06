// middleware/usageLogger.js
const { createClient } = require('@supabase/supabase-js');

// Supabase istemcisi
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Path → tool_id eşlemesi; kendi tools tablonuzdaki UUID’leri girin
const TOOL_MAP = {
  '/api/gemini':   '11111111-2222-3333-4444-555555555555',
  '/api/deepseek': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '/api/grok2':    '99999999-8888-7777-6666-555555555555',
  // diğer rotalar...
};

function usageLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || req.headers['x-user-id'] || null;
    const toolId = TOOL_MAP[req.path] || null;

    try {
      await supabase
        .from('usage_logs')
        .insert([{
          user_id:     userId,
          tool_id:     toolId,
          invoked_at:  new Date().toISOString(),
          params:      req.body,
          duration_ms: duration,
          status:      res.statusCode < 400 ? 'success' : 'error',
          error_code:  res.statusCode < 400 ? null : `HTTP_${res.statusCode}`,
          source:      'api'
        }]);
    } catch (err) {
      console.error('UsageLog Error:', err);
    }
  });

  next();
}

module.exports = { usageLogger };
