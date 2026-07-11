app.post('/api/generate', async (req, res) => {
  console.log('📩 Received body:', req.body);

  const { selectedProducts } = req.body;

  if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
    return res.status(400).json({ error: 'No products selected' });
  }

  const productList = selectedProducts.join(', ');

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
    console.log('📤 Sending request to Anthropic...');
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',   // ✅ guaranteed active
      max_tokens: 80,
      system: `Write a 2-sentence Hinglish cafe review. Focus: "${randomFocus}". Be specific about taste, texture, price, or service. Avoid clichés.`,
      messages: [{
        role: 'user',
        content: `Items ordered: ${productList}`
      }]
    }, { timeout: 30000 });

    console.log('✅ Response received');
    const review = message.content.find(b => b.type === 'text')?.text?.trim() || '';
    res.json({ review });

  } catch (err) {
    console.error('❌ Anthropic error:');
    console.error('Message:', err.message);
    if (err.status) console.error('Status:', err.status);
    if (err.response) {
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    res.status(500).json({ error: err.message });
  }
});
