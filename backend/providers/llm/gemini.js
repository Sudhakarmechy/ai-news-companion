// backend/providers/llm/gemini.js
require('dotenv').config();
const LLMProvider = require('./base');
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiProvider extends LLMProvider {
  constructor() {
    super();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing in .env");
    }

    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async summarizeArticle(article, options = {}) {
    const mode = options.mode || 'brief';

    // ✅ FIXED: Build COMPLETE prompt (system + article content)
    const systemPrompt = mode === 'detailed' ? `
You are a news explainer.
Explain the news clearly to a general audience.
Include:
- background
- context  
- why it matters
- consequences
Avoid opinions.
Return JSON ONLY.
{
  "summary": "...",
  "hook": "...",
  "question": "..."  
}
` : `
Summarize the news briefly (30–60 seconds).
Return JSON ONLY.
{
  "summary": "...",
  "hook": "...", 
  "question": "..."
}`;

    // ✅ FIXED: Define PROMPT with article content
    const prompt = `
${systemPrompt}

ARTICLE:
Title: ${article.title}
Content: ${article.content || article.description || article.rawText || ''}

Summarize this article above.
`;

    try {
      // ✅ FIXED: Use 'prompt' variable
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // ✅ Better JSON parsing with fallback
      try {
        const parsed = JSON.parse(cleaned);
        return {
          summary: parsed.summary || cleaned.slice(0, 300),
          hook: parsed.hook || `${article.title.slice(0, 50)}...`,
          question: parsed.question || "What do you think about this?",
          source: 'gemini'
        };
      } catch (parseErr) {
        console.warn("[Gemini] JSON parse failed:", cleaned.slice(0, 100));
        return {
          summary: cleaned.slice(0, 300),
          hook: article.title.slice(0, 50) + '...',
          question: "What do you think about this news?",
          source: 'gemini-raw'
        };
      }
    } catch (err) {
      console.error("[Gemini] Error:", err.message);
      
      // ✅ Rate limit + fallback handling
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.warn("[Gemini] Rate limited, using fallback");
        return {
          summary: (article.description || article.content || '').slice(0, 300) || 'Summary unavailable.',
          hook: article.title || 'News update',
          question: 'What do you think about this?',
          source: 'fallback'
        };
      }
      
      throw err; // Re-throw other errors
    }
  }
}

module.exports = GeminiProvider;
