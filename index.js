/**
 * index.js - Hybrid Gemi AI Bot Backend
 * Node.js + Express + TinyLlama offline + Gemini API online
 * Features:
 * - Hybrid mode: Online (Gemini) fallback to offline (TinyLlama)
 * - Secure API key management via ENV
 * - JSON API endpoints for frontend
 * - Modular & professional structure
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // For Gemini API calls
import fs from 'fs';
import crypto from 'crypto';

// -------------------------------------
// Configuration / Environment
// -------------------------------------
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Render secret
const MODEL_PATH = './tinyllama-model.bin';        // Offline model path
const MODEL_KEY = process.env.MODEL_KEY_HEX;      // For encrypted offline model
const USE_OFFLINE = true;                          // Toggle offline fallback

// -------------------------------------
// Utility: Decrypt offline model
// -------------------------------------
function decryptBuffer(encBuf, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const iv = encBuf.slice(encBuf.length - 28, encBuf.length - 16);
  const authTag = encBuf.slice(encBuf.length - 16);
  const ciphertext = encBuf.slice(0, encBuf.length - 28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain;
}

// Load offline model into memory (optional: decrypt if encrypted)
let offlineModelBytes = null;
if (USE_OFFLINE && fs.existsSync(MODEL_PATH)) {
  const encModel = fs.readFileSync(MODEL_PATH);
  offlineModelBytes = decryptBuffer(encModel, MODEL_KEY);
  console.log('Offline TinyLlama model loaded into memory.');
}

// -------------------------------------
// Express App Setup
// -------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------
// Utility: Online Gemini API call
// -------------------------------------
async function callGeminiAPI(userMessage) {
  try {
    const response = await fetch('https://api.gemini.example/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gemini-chat-1',      // adjust per Gemini API
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 300
      })
    });
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

// -------------------------------------
// Utility: Offline TinyLlama fallback
// -------------------------------------
function callOfflineModel(userMessage) {
  // This is pseudo: actual TinyLlama JS/Node integration depends on library
  // For demonstration, we return a dummy reply
  return `Offline TinyLlama reply to: "${userMessage}"`;
}

// -------------------------------------
// API Endpoint: Chat
// -------------------------------------
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Attempt online first
  let reply = await callGeminiAPI(message);

  // Fallback offline if online fails
  if (!reply && USE_OFFLINE) {
    reply = callOfflineModel(message);
  }

  if (!reply) return res.status(500).json({ error: 'AI unavailable' });
  res.json({ reply });
});

// -------------------------------------
// API Endpoint: Simple Search (Internet / Gemini)
// -------------------------------------
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const reply = await callGeminiAPI(`Search online: ${query}`);
    res.json({ result: reply || 'No results found' });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// -------------------------------------
// API Endpoint: Image Generation
// -------------------------------------
app.post('/api/image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const reply = await callGeminiAPI(`Generate image for: ${prompt}`);
    // Response should be image URL or base64, depending on API
    res.json({ image: reply });
  } catch (err) {
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// -------------------------------------
// Health check endpoint
// -------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', hybrid: USE_OFFLINE ? 'online+offline' : 'online-only' });
});

// -------------------------------------
// Start Server
// -------------------------------------
app.listen(PORT, () => {
  console.log(`Hybrid Gemi Bot backend running on port ${PORT}`);
});
