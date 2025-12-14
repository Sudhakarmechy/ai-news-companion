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
    const { mode = "brief", language = "en" } = options;

    const prompt = `
Summarize this news article.

=== ARTICLE TITLE ===
${article.title}

=== ARTICLE DESCRIPTION ===
${article.description || ""}

=== SUMMARY STYLE ===
Mode: ${mode}
Language: ${language}

Return a JSON object with the following structure:
{
  "summary": "short description",
  "hook": "attention-grabbing sentence",
  "question": "curiosity question about the news"
}
    `;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text
  .replace(/```json/gi, '')
  .replace(/```/g, '')
  .trim();

try {
  return JSON.parse(cleaned);
} catch (err) {
  console.error("[summarizer] Gemini JSON parse failed:", cleaned);
  return {
    summary: cleaned,
    hook: "",
    question: "",
  };
}
  }
}

module.exports = GeminiProvider;
