import axios from 'axios';

const API_BASE = 'http://localhost:8787';

function getKeys(prefix: string): string[] {
  return Object.entries(import.meta.env)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}

export async function queryLLM(slug: string, prompt: string): Promise<string> {
  if (slug.startsWith('gpt-')) return await queryOpenAIWithFallback(prompt);
  if (slug.startsWith('gemini-')) return await queryGeminiWithFallback(prompt);
  if (slug.startsWith('claude-')) return await queryClaudeWithFallback(prompt);
  if (slug === 'grok-2') return await queryGrokWithFallback(prompt);
  if (slug === 'tokenomics-analys-agent') return await queryTokenomics(prompt);
  if (slug === 'audit-analys-agent') return await queryAudit(prompt);
  if (slug === 'article-writer-agent') return await queryArticleWriter(prompt);
  throw new Error(`Unsupported slug: ${slug}`);
}

export async function queryOpenAIWithFallback(prompt: string, model: string = 'gpt-4o'): Promise<string> {
  const keys = getKeys('VITE_OPENAI_KEY_');
  for (const key of keys) {
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model, messages: [{ role: 'user', content: prompt }] },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return res.data.choices?.[0]?.message?.content ?? 'OpenAI returned no content.';
    } catch (err: any) {
      console.warn(`[OpenAI Fallback] Failed with key: ${key}`);
      continue;
    }
  }
  throw new Error('All OpenAI keys failed.');
}

export async function queryGeminiWithFallback(prompt: string, model: string = 'models/gemini-1.5-pro-001'): Promise<string> {
  const keys = getKeys('VITE_GEMINI_KEY_');
  for (const key of keys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no content.';
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Failed with key: ${key}`);
      continue;
    }
  }
  throw new Error('All Gemini keys failed.');
}

export async function queryClaudeWithFallback(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      'http://localhost:8787/api/claude', // Proxy sunucuna giden istek
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '5c41eea8-5340-4272-a183-ed144396bca4', // veya dinamik olarak userId çekebilirsin
          'x-agent-id': '77777777-6666-5555-4444-333333333333', // agentId sabit veya değişkense ona göre
        },
      }
    );
    return res.data.result ?? 'Claude returned no content.';
  } catch (err: any) {
    console.error('[Claude Error]', err.response?.data || err.message);
    return 'Claude request failed.';
  }
}



export async function queryGrokWithFallback(prompt: string): Promise<string> {
  const keys = getKeys('VITE_GROK_KEY_');
  for (const key of keys) {
    try {
      const res = await axios.post(
        `${API_BASE}/api/grok2`,
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return res.data.result ?? 'Grok-2 returned no content.';
    } catch (err: any) {
      console.warn(`[Grok Fallback] Failed with key: ${key}`);
      continue;
    }
  }
  throw new Error('All Grok keys failed.');
}

export async function queryGeminiWithSystemPrompt(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/gemini`,
      {
        prompt,
        systemPrompt:
          'You are a senior full-stack web developer with 10+ years of experience. Always respond with direct, concise, and technical answers. Use code examples whenever possible.',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data.result ?? 'Gemini App-Creators returned no content.';
  } catch (err: any) {
    console.error('[Gemini (App-Creators) Error]', err.response?.data || err.message);
    return 'Gemini App-Creators response failed.';
  }
}

export async function queryStability(prompt: string): Promise<string> {
  try {
    await axios.post(
      `${API_BASE}/api/hf-image`,
      { inputs: prompt },
      {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
      }
    );
    return 'Image generated.';
  } catch (err: any) {
    console.error('[Stability Error]', err.response?.data || err.message);
    return 'Stability response failed.';
  }
}

export async function queryDeepseek(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/deepseek`,
      { prompt },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = res.data;
    if (data.error) {
      const code = data.detail?.error?.code;
      if (code === 'invalid_request_error') {
        console.warn('[Deepseek insufficient balance], falling back to Gemini');
        return await queryGeminiWithFallback(prompt);
      }
      return data.error;
    }
    if (data.result) {
      return data.result;
    }
    return 'Deepseek returned no content.';
  } catch (err: any) {
    console.error('[Deepseek Error]', err.response?.data || err.message);
    if (err.response?.status === 402) {
      console.warn('[Deepseek 402], falling back to Gemini');
      return await queryGeminiWithFallback(prompt);
    }
    return 'Deepseek request failed.';
  }
}

export async function queryTokenomics(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/llm`,
      {
        slug: 'tokenomics-analys-agent',
        prompt,
      }
    );
    return res.data.result ?? 'Tokenomics agent returned no content.';
  } catch (err: any) {
    console.error('[Tokenomics Error]', err.response?.data || err.message);
    return 'Tokenomics agent request failed.';
  }
}

export async function queryAudit(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/llm`,
      {
        slug: 'audit-analys-agent',
        prompt,
      }
    );
    return res.data.result ?? 'Audit agent returned no content.';
  } catch (err: any) {
    console.error('[Audit Error]', err.response?.data || err.message);
    return 'Audit agent request failed.';
  }
}

export async function queryArticleWriter(prompt: string): Promise<string> {
  try {
    const res = await axios.post(
      `${API_BASE}/api/llm`,
      {
        slug: 'article-writer-agent',
        prompt,
      }
    );
    return res.data.result ?? 'Article Writer returned no content.';
  } catch (err: any) {
    console.error('[Article Writer Error]', err.response?.data || err.message);
    return 'Article Writer request failed.';
  }
}
