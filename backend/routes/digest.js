const express = require('express');
const router = express.Router();

const { generateDigest } = require('../services/digest/digestEngine');

// ✅ SINGLE ROUTE HANDLER - merges both versions
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const {
      userId = null,        // ✅ null instead of 'anonymous' (matches engine)
      category,             // ✅ optional
      limit = 7,            // ✅ default 7
      cursor                // ✅ pagination
    } = req.query;

    // ✅ Validate type
    const validTypes = ['daily', 'weekly', 'trending', 'category', 'evening','category'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid digest type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // ✅ Validate/convert params
    const digestParams = {
      type,
      userId: userId || null,
      category: category || null,
      limit: limit ? Math.max(1, Math.min(Number(limit), 50)) : 7, // 1-50 range
      cursor: cursor || null
    };

    console.log('[digest] Generating:', digestParams);

    const result = await generateDigest(digestParams);

    // ✅ Consistent response shape
    res.json({
      success: true,
      type,
      count: result.items.length,
      items: result.items,
      nextCursor: result.nextCursor || null,
      hasMore: Boolean(result.hasMore),
      cached: result.cached || false
    });

  } catch (err) {
    console.error('[digest route error]', err);
    
    // ✅ Better error responses
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: 'Digest not available' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate digest',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Health check
router.get('/', (req, res) => {
  res.json({ 
    message: 'Digest API healthy',
    endpoints: ['GET /digest/:type?userId=...&category=...&limit=...&cursor=...']
  });
});

module.exports = router;
