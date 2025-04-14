const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 8787;

const HF_API_URL = 'https://api-inference.huggingface.co/models/prompthero/openjourney';

const HF_API_KEY = process.env.VITE_HUGGINGFACE_API_KEY;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/hf-image', async (req, res) => {
  const { prompt } = req.body;
  console.log('[proxy] Received prompt:', prompt);

  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Görsel binary geliyor
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    const message = error?.response?.data?.toString('utf8') || error.message;
    console.error('[proxy] HuggingFace API error:', message);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[proxy] Listening on http://localhost:${PORT}`);
});
