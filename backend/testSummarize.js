// backend/testSummarize.js
require('dotenv').config();
const axios = require('axios');

const OPENAI_API_KEY1 = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY1) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

async function summarizeArticle() {
  const articleText = `
India's central bank has announced a new set of rules for digital lending apps,
aimed at increasing transparency and protecting consumers. The guidelines include
stricter data privacy requirements, limits on hidden charges, and clearer
disclosure of interest rates. Fintech companies have welcomed the move but warned
about the need for implementation clarity.
`;

  const prompt = `
You are a factual, concise news summarizer.

Article:
${articleText}

Task: Summarize this article in 80-120 words. Then give:
- a short witty hook (one sentence)
- a question to engage the listener.

Return the result in this JSON format:
{
  "summary": "...",
  "hook": "...",
  "question": "..."
}
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // or another available model in your plan
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY1}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;
    console.log("RAW MODEL OUTPUT:\n", text);

    try {
      const parsed = JSON.parse(text);
      console.log("\nParsed JSON:", parsed);
    } catch (e) {
      console.log("\nCould not parse JSON, raw output above.");
    }

  } catch (err) {
    console.error("Error from OpenAI:", err.response?.data || err.message);
  }
}

summarizeArticle();
