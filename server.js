const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔑 API key present?', !!process.env.ANTHROPIC_API_KEY);

app.use(cors({
  origin: [
    'https://nbc-ai-reviews-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ---- Static business data (no longer sent in every request) ----
const BIZ_NAME = "Nothing Before Coffee";
const BIZ_LOCATION = "Ahmedabad, Gujarat";

const DATABASE = {
  business: {
    name: BIZ_NAME,
    description: "Premium coffee cafe offering hot coffee, cold coffee, shakes, food and desserts at affordable prices. Known for quality, vibe, and youth culture. Founded by Akshay Kedia and Ankesh Jain.",
    location: BIZ_LOCATION,
    categories: { /* same as before */ }
  }
};

app.get('/api/business', (req, res) => {
  res.json(DATABASE.business);
});

// ---- Optimised generation endpoint ----
app.post('/api/generate', async (req, res) => {
  const { selectedProducts } = req.body;

  if (!selectedProducts || selectedProducts.length === 0) {
    return res.status(400).json({ error: 'No products selected' });
  }

  const productList = selectedProducts.join(', ');

  // Focus options (keep short)
  const focuses = [
    'taste and flavour',
    'value for money',
    'service and staff behaviour',
    'ambience and vibe',
    'overall experience'
  ];
  const randomFocus = focuses[Math.floor(Math.random() * focuses.length)];

  // Use the cheapest model: Claude Haiku
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',    // 👈 Haiku: ~80% cheaper
      max_tokens: 120,                     // 👈 reduced from 300
      system: `You are an Indian customer writing a cafe review in Hinglish. 
Focus on "${randomFocus}". Be specific about taste, texture, price, or service. 
Avoid clichés. Keep it short (2–3 sentences) and conversational.`,
      messages: [{
        role: 'user',
        content: `Items: ${productList}\nWrite a positive review.`   // 👈 minimal input
      }]
    });

    const review = message.content.find(b => b.type === 'text')?.text?.trim() || '';
    res.json({ review });

  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
});
