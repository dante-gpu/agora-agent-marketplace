import axios from 'axios';
import { GEMINI_API_KEY } from './env';

const API_BASE = 'http://localhost:8787';

export async function queryLLM(slug: string, prompt: string): Promise<string> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, prompt })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'LLM proxy error');
  }

  const { result } = await res.json();
  return result;
}


async function queryOpenAI(prompt: string, model: string): Promise<string> {
  try {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages: [{ role: 'user', content: prompt }] },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data.choices?.[0]?.message?.content ?? 'OpenAI returned no content.';
  } catch (err: any) {
    console.error('[OpenAI Error]', err.response?.data || err.message);
    return 'OpenAI response failed.';
  }
}

export async function queryGemini(
  prompt: string,
  model: string = 'models/gemini-1.5-pro-001'
): Promise<string> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no content.';
  } catch (err: any) {
    console.error('[Gemini Error]', err);
    return 'Failed to get response from Gemini.';
  }
}

async function queryGeminiWithSystemPrompt(prompt: string): Promise<string> {
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
    console.error(
      '[Gemini (App-Creators) Error]',
      err.response?.data || err.message
    );
    return 'Gemini App-Creators response failed.';
  }
}

async function queryStability(prompt: string): Promise<string> {
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

async function queryDeepseek(prompt: string): Promise<string> {
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
        return await queryGemini(prompt);
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
      return await queryGemini(prompt);
    }
    return 'Deepseek request failed.';
  }
}

async function queryGrok(prompt: string): Promise<string> {
  try {
    const GROK2_API_KEY = import.meta.env.VITE_GROK2_API_KEY;
    const res = await axios.post(
      `${API_BASE}/api/grok2`,
      { prompt },
      {
        headers: {
          Authorization: `Bearer ${GROK2_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data.result ?? 'Grok-2 returned no content.';
  } catch (err: any) {
    console.error('[Grok-2 Error]', err.response?.data || err.message);
    return 'Grok-2 request failed.';
  }
}

async function queryTokenomics(prompt: string): Promise<string> {
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

// --- Audit Analysis Agent ---
async function queryAudit(prompt: string): Promise<string> {
  try {
    // Proxy üzerinden çağırıyoruz, direkt api.io.net kullanılmıyor
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