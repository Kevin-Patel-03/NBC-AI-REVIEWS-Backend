const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: confirm API key is loaded (will appear in Render logs)
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

const DATABASE = {
  business: {
    name: "Nothing Before Coffee",
    description: "Premium coffee cafe offering hot coffee, cold coffee, shakes, food and desserts at affordable prices. Known for quality, vibe, and youth culture. Founded by Akshay Kedia and Ankesh Jain.",
    location: "Ahmedabad, Gujarat",
    googleSearch: "Nothing Before Coffee review",
    categories: {
      "Hot Coffee":         ["Americano", "Cappuccino", "Latte", "Espresso", "Macchiato", "Irish Coffee", "Hot Chocolate"],
      "Cold Coffee":        ["Iced Americano", "Iced Latte", "Cold Brew", "Iced Mocha", "Cold Coffee with Ice Cream"],
      "Shrappe (Frappe)":   ["Classic Shrappe", "Caramel Shrappe", "Mocha Shrappe", "Vanilla Shrappe", "Hazelnut Shrappe"],
      "Shakes":             ["Chocolate Shake", "Strawberry Shake", "Vanilla Shake", "Oreo Shake", "KitKat Shake", "Banana Shake"],
      "Food & Snacks":      ["Tandoori Maggi", "Veg Burger", "Cheese Sandwich", "French Fries", "Pizza", "Garlic Bread"],
      "Desserts":           ["Brownie with Ice Cream", "Chocolate Mousse", "Cheesecake", "Waffles", "Pastries"],
      "Service & Ambience": ["ambience", "staff behaviour", "service speed", "seating comfort", "music", "outdoor seating"],
      "Founders (Akshay Kedia)": ["Akshay Kedia's vision", "the founders' passion", "their community focus", "Ankesh Jain's leadership"],
      "Value for Money":    ["pricing", "affordability", "budget-friendly", "quality-price ratio", "₹100 coffee offer"],
      "Recommend":          ["the whole experience", "the coffee quality", "the vibrant vibe", "the consistency", "the youth culture"]
    }
  }
};

app.get('/api/business', (req, res) => {
  res.json(DATABASE.business);
});

app.post('/api/generate', async (req, res) => {
  const { selectedProducts } = req.body;

  if (!selectedProducts || selectedProducts.length === 0) {
    return res.status(400).json({ error: 'No products selected' });
  }

  const biz = DATABASE.business;
  const productList = selectedProducts.join(', ');
   
  // ✅ Paste the focuses array and randomFocus here
  const focuses = [
    'taste and flavour',
    'value for money',
    'service and staff behaviour',
    'ambience and vibe',
    'overall experience'
  ];
  const randomFocus = focuses[Math.floor(Math.random() * focuses.length)];
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      // ✅ Use the latest Sonnet model (valid for all accounts)
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You are a genuine Indian customer writing a product review.  

`You are a real customer in Ahmedabad writing a short, honest cafe review in Hinglish (Roman script) for Nothing Before Coffee.

ORDER: ${orderedItems}
FOCUS: ${randomFocus}
STRUCTURE: ${randomStructure}
OPENER_TYPE: ${randomOpener}

Write a 2-3 sentence review using ONLY the items listed in ORDER — do not invent or add items that were not ordered.

Rules:
- Follow OPENER_TYPE for your first sentence — do not default to vibe/staff openers unless that's what's specified.
- Follow STRUCTURE — if it says single-item-deep-dive, do not pad with a second unordered item.
- FOCUS should visibly shape word choice: if focus is "price," lead with cost details, not taste. If focus is "texture," skip vibe/staff entirely.
- Include ONE tangible, specific detail (a number, a texture word, a comparison to something else, a specific flavor note) — not a generic adjective.
- Tone: grounded, slightly informal, like a WhatsApp message to a friend — not a marketing blurb.

Never use these words/phrases: balanced, perfectly balanced, na zyada sweet na zyada strong/bland, thick (for hot chocolate — vary texture words: creamy/frothy/watery/dense/light), rich, chill vibe, cozy, welcoming, highly recommend, amazing, exceeded expectations, must-try, paisa vasool, overall.

Do not mention staff or ambience unless FOCUS is staff or ambience.

Output: only the review text. No labels, no quotes, no bullet points.`,
      messages: [{
        role: 'user',
        content: `Business: ${biz.name}
Description: ${biz.description}
Location: ${biz.location}

Customer selected these items: ${productList}

Write a 2-3 sentence positive review based on these selected items.`
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
