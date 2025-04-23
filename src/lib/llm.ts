import axios from 'axios';
import { GEMINI_API_KEY } from './env';

export async function queryLLM(slug: string, prompt: string): Promise<string> {
  if (slug === 'gpt-4o' || slug === 'gpt_4_0') {
    return await queryOpenAI(prompt, 'gpt-4o');
  }

  if (slug === 'gpt_3_5_turbo') {
    return await queryOpenAI(prompt, 'gpt-3.5-turbo');
  }

  if (slug === 'gemini-1-5-pro') {
    return await queryGemini(prompt);
  }

  if (slug === 'app-creators') {
    return await queryGeminiWithSystemPrompt(prompt);
  }

  if (slug === 'stablelm-2') {
    return await queryStability(prompt);
  }

  if (slug === 'gemini-2-0-flash') {
    return await queryGemini(prompt); 
  }

  throw new Error(`No handler for slug: ${slug}`);
}

async function queryOpenAI(prompt: string, model: string): Promise<string> {
  try {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    console.log('🔑 OPENAI_API_KEY:', OPENAI_API_KEY);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err: any) {
    console.error('[OpenAI Error]', err.response?.data || err.message);
    throw new Error('OpenAI response failed');
  }
}

export async function queryGemini(
  prompt: string,
  model: string = 'models/gemini-1.5-pro-001'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json();

  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  console.error('[Gemini Error]', data);
  throw new Error('Failed to get response from Gemini');
}


async function queryGeminiWithSystemPrompt(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      'http://localhost:8787/api/gemini',
      {
        prompt,
        systemPrompt:
          'You are a senior full-stack web developer with 10+ years of experience. Always respond with direct, concise, and technical answers. Use code examples whenever possible. Do not ask the user for clarification—make assumptions and proceed with the most logical solution. Your primary stack includes Next.js, React, TypeScript, Node.js, and modern CI/CD workflows. Keep answers output-oriented and developer-ready.',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.result;
  } catch (err: unknown) {
    const error = err as any;
    console.error('[Gemini (App-Creators) Error]', error.response?.data || error.message);
    throw new Error('Gemini response for App-Creators failed');
  }
}

async function queryStability(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      'http://localhost:8787/api/stability',
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.result;
  } catch (err: unknown) {
    const error = err as any;
    console.error('[Stability Error]', error.response?.data || error.message);
    throw new Error('Stability response failed');
  }
}
