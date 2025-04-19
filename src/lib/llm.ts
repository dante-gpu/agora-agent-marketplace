import axios from 'axios';

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

  if (slug === 'stablelm-2') {
    return await queryStability(prompt);
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
          model, // örnek: gpt-3.5-turbo
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
  

async function queryGemini(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      'http://localhost:8787/api/gemini',
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
    console.error('[Gemini Error]', error.response?.data || error.message);
    throw new Error('Gemini response failed');
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