// // backend/testSummarize.js
// require('dotenv').config();
// const axios = require('axios');

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY1;

// if (!GEMINI_API_KEY) {
//   console.error("Missing OPENAI_API_KEY in .env");
//   process.exit(1);
// }

// async function summarizeArticle() {
//   const articleText = `
// India's central bank has announced a new set of rules for digital lending apps,
// aimed at increasing transparency and protecting consumers. The guidelines include
// stricter data privacy requirements, limits on hidden charges, and clearer
// disclosure of interest rates. Fintech companies have welcomed the move but warned
// about the need for implementation clarity.
// `;

// //   const prompt = `
// // You are a factual, concise news summarizer.

// // Article:
// // ${articleText}

// // Task: Summarize this article in 80-120 words. Then give:
// // - a short witty hook (one sentence)
// // - a question to engage the listener.

// // Return the result in this JSON format:
// // {
// //   "summary": "...",
// //   "hook": "...",
// //   "question": "..."
// // }
// //   `;

//   try {
    
//     // const response = await axios.post(
//     //   "https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}",
//     //   {
//     //     model: ${GEMINI_MODEL}, // or another available model in your plan
//     //     messages: [
//     //       { role: "system", content: "You are a helpful assistant." },
//     //       { role: "user", content: prompt }
//     //     ],
//     //     temperature: 0.3,
//     //   },
//     //   {
//     //     headers: {
//     //       "Authorization": `Bearer ${OPENAI_API_KEY1}`,
//     //       "Content-Type": "application/json"
//     //     }
//     //   }
//     // );

//   // console.log("FULL RESPONSE:\n", response.data);
//   //   const text = response.data.choices[0].message.content;
//   //   console.log("RAW MODEL OUTPUT:\n", text);

//   //   try {
//   //     const parsed = JSON.parse(text);
//   //     console.log("\nParsed JSON:", parsed);
//   //   } catch (e) {
//   //     console.log("\nCould not parse JSON, raw output above.");
//   //   }

//  // --- START: Define the JSON Schema ---
// // This schema defines the exact structure the model MUST follow.
// const newsSummarySchema = {
//     type: "object",
//     properties: {
//         summary: {
//             type: "string",
//             description: "A summary of the article between 80-120 words.",
//         },
//         hook: {
//             type: "string",
//             description: "A short, witty hook (one sentence).",
//         },
//         question: {
//             type: "string",
//             description: "A question to engage the listener.",
//         },
//     },
//     required: ["summary", "hook", "question"],
// };
// // --- END: Define the JSON Schema ---

// // Assume these are defined earlier in your scope
// const articleText = "Your full news article text goes here...";

//     const GEMINI_MODEL = "gemini-2.5-flash";
//     // NOTE: We pass the key as a query parameter in the URL.
//     const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

//     // The entire task instruction is now part of the user's content
//     const prompt = `
//         You are a factual, concise news summarizer.
        
//         Article to summarize:
//         ---
//         ${articleText}
//         ---
        
//         Task: Summarize this article in 80-120 words. Then generate a short witty hook (one sentence) and a question to engage the listener.
//         Return the result based *only* on the provided JSON schema.
//     `;

//         const response = await axios.post(
//             API_URL,
//             // --- CORRECT GEMINI REQUEST BODY STRUCTURE ---
//             {
//                 contents: [
//                     // The instruction is sent as the user's message part
//                     { role: "user", parts: [{ text: prompt }] }
//                 ],
//                 config: {
//                     // This configuration guarantees the output is JSON
//                     temperature: 0.3,
//                     responseMimeType: "application/json",
//                     responseSchema: newsSummarySchema,
//                 }
//             },
//             // --- CORRECT GEMINI HEADERS (API Key is in URL, not Header) ---
//             {
//                 headers: {
//                     // We only need the Content-Type header
//                     "Content-Type": "application/json"
//                     // The Authorization header is NOT needed here for API Key
//                 }
//             }
//         );

//         // --- CORRECT GEMINI RESPONSE PARSING ---
//         // The model's response is deep inside the candidates array
//         const fullResponseText = response.data.candidates[0].content.parts[0].text;
        
//         console.log("FULL RESPONSE OBJECT:\n", response.data);
//         console.log("RAW MODEL JSON OUTPUT:\n", fullResponseText);

//         // Since we enforced JSON output, parsing should now succeed
//         const parsed = JSON.parse(fullResponseText);
//         console.log("\nParsed JSON:", parsed);

//         return parsed;

// // You can now call the function:
// // summarizeArticle(articleText);

//   } catch (err) {
//     console.error("Error from OpenAI:", err.response?.data || err.message);
//   }
// }

// summarizeArticle();



/**
 * Node.js script to call the Gemini API for structured JSON output.
 * * Prerequisites:
 * 1. npm install dotenv axios
 * 2. Create a .env file with GEMINI_API_KEY1=YOUR_API_KEY
 */
require('dotenv').config();
const axios = require('axios');

// --- 1. CONFIGURATION AND AUTH ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY1; 
const GEMINI_MODEL = "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY1 in .env");
    process.exit(1);
}

// --- 2. JSON SCHEMA DEFINITION ---
// This schema defines the exact structure the model MUST follow.
const newsSummarySchema = {
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: "A summary of the article between 80-120 words.",
        },
        hook: {
            type: "string",
            description: "A short, witty hook (one sentence).",
        },
        question: {
            type: "string",
            description: "A question to engage the listener.",
        },
    },
    required: ["summary", "hook", "question"],
};

async function summarizeArticle() {
    // The article content you want to summarize
    const articleText = `
        India's central bank has announced a new set of rules for digital lending apps,
        aimed at increasing transparency and protecting consumers. The guidelines include
        stricter data privacy requirements, limits on hidden charges, and clearer
        disclosure of interest rates. Fintech companies have welcomed the move but warned
        about the need for implementation clarity.
    `;

    // --- TROUBLESHOOTING CHANGE: Explicit URL Concatenation ---
    // Ensure the URL is correctly constructed to hit the generateContent endpoint.
    const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    const API_METHOD = ":generateContent?key=";
    const API_URL = API_BASE_URL + GEMINI_MODEL + API_METHOD + GEMINI_API_KEY;

    // The user instruction is simplified. The persona is now in systemInstruction.
    const prompt = `
        Article to summarize:
        ---
        ${articleText}
        ---
        
        Task: Summarize this article in 80-120 words. Then generate a short witty hook (one sentence) and a question to engage the listener.
        Return the result based *only* on the provided JSON schema.
    `;

    try {
        const response = await axios.post(
            API_URL,
            // --- CORRECT GEMINI REQUEST BODY STRUCTURE ---
            {
                // FIXED: systemInstruction must be an object with 'parts' array (text-only for now).
                systemInstruction: { 
                    parts: [{ text: "You are a factual, concise news summarizer." }] 
                },
                
                // The contents array holds the user's prompt
                contents: [
                    { role: "user", parts: [{ text: prompt }] }
                ],
                
                // FIXED: Use 'generationConfig' (not 'config'), 'response_mime_type', and 'response_json_schema'.
                generationConfig: {
                    temperature: 0.3,
                    response_mime_type: "application/json",
                    response_json_schema: newsSummarySchema,
                }
            },
            // --- AXIOS CONFIG (Only Content-Type needed) ---
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        // --- CORRECT GEMINI RESPONSE PARSING ---
        const fullResponseText = response.data.candidates[0].content.parts[0].text;
        
        console.log("------------------------------------------");
        console.log(`✅ Success! Model: ${GEMINI_MODEL}`);
        console.log("RAW MODEL JSON OUTPUT:\n", fullResponseText);

        const parsed = JSON.parse(fullResponseText);
        console.log("\nParsed JSON Object:", parsed);
        console.log("------------------------------------------");

        return parsed;

    } catch (err) {
        // Updated error logging for clarity
        console.error("------------------------------------------");
        console.error("❌ Error from Gemini API:");
        console.error("Check your API Key and ensure the Node.js environment is correctly handling the request.");
        console.error(err.response?.data || err.message);
        console.error("------------------------------------------");
    }
}

summarizeArticle();

