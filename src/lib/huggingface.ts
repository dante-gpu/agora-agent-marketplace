export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('[HUGGINGFACE] Sending prompt to proxy server:', prompt);

    const response = await fetch('http://localhost:8787/api/hf-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    console.log('[HUGGINGFACE] response.ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HUGGINGFACE ERROR]', errorText);
      throw new Error('Image generation failed');
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    return imageUrl;
  } catch (error) {
    console.error('[HUGGINGFACE FINAL ERROR]', error);
    throw new Error('Failed to fetch image from proxy.');
  }
}
