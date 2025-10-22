// index.js

// Zaroori packages import karna
const express = require('express');
const path = require('path');
require('dotenv').config(); // .env file se environment variables load karna

// Google Gemini aur SerpAPI clients ko import karna
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getJson } = require('google-search-results-nodejs');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// API Clients ko initialize karna
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Middleware ---
// JSON requests ko parse karne ke liye
app.use(express.json());
// 'public' folder se static files (HTML, CSS, JS) serve karne ke liye
app.use(express.static(path.join(__dirname, 'public')));


// --- API Route ---
// Frontend is route par request bhejega
app.post('/api/chat', async (req, res) => {
    try {
        const userInput = req.body.message.toLowerCase();
        let response;

        // Command check karna: /image <prompt>
        if (userInput.startsWith('/image')) {
            const prompt = userInput.substring(7).trim();
            if (!prompt) {
                return res.json({ reply: "Please provide a prompt for the image. Usage: /image a cat playing piano", type: "text" });
            }
            
            // Gemini se image generate karwana
            const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }); // Ya jo bhi image model aap use kar rahe hain
            // NOTE: Gemini's current public models are text-to-text. Image generation (Imagen) is a different API. 
            // This is a placeholder for how you would call it. For now, we'll return a placeholder.
            // const imageUrl = await generateImageWithGemini(prompt); 
            const imageUrl = `https://source.unsplash.com/500x300/?${encodeURIComponent(prompt)}`; // Placeholder
            
            response = { 
                reply: `Here's an image for "${prompt}":`, 
                type: 'image', 
                data: imageUrl 
            };

        // Command check karna: /search <query>
        } else if (userInput.startsWith('/search')) {
            const query = userInput.substring(8).trim();
            if (!query) {
                return res.json({ reply: "Please provide a search query. Usage: /search what is the capital of France", type: "text" });
            }

            // SerpAPI se search karwana
            const searchResults = await new Promise((resolve, reject) => {
                getJson({
                    api_key: process.env.SERP_API_KEY,
                    q: query,
                }, (json) => {
                    resolve(json);
                });
            });

            // Pehle result ka snippet nikalna
            const firstResult = searchResults.organic_results[0];
            const summary = firstResult ? `According to my search: "${firstResult.snippet}" (Source: ${firstResult.link})` : "Sorry, I couldn't find anything for that.";
            
            response = {
                reply: summary,
                type: 'text' // Search results ko text ki tarah bhej rahe hain
            };

        // Normal chat
        } else {
            // Normal text response (future me Gemini text model se connect kar sakte hain)
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(req.body.message);
            const geminiResponse = await result.response;
            
            response = {
                reply: geminiResponse.text(),
                type: 'text'
            };
        }

        res.json(response);

    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ reply: 'Oops! Something went wrong on my end.', type: 'error' });
    }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
