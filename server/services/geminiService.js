import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, getChatPrompt, getGeneratePrompt, getConvertPrompt, getAutocompletePrompt } from '../utils/prompts.js';

let ai = null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

export const chatWithAI = async (context, history, userMessage) => {
  const genai = getAI();
  if (!genai) throw new Error('Gemini API is not configured.');

  const formattedMessage = getChatPrompt(context, userMessage);
  
  // Format history for the API:
  // Gemini requires history to start with a 'user' turn and alternate between 'user' and 'model'
  const formattedHistory = [];
  for (const msg of history || []) {
    const role = msg.role === 'ai' ? 'model' : 'user';
    // Skip initial greeting or leading model messages
    if (formattedHistory.length === 0 && role !== 'user') {
      continue;
    }
    if (!msg.text || !msg.text.trim()) {
      continue;
    }
    formattedHistory.push({
      role,
      parts: [{ text: msg.text }]
    });
  }

  const chat = genai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
    },
    ...(formattedHistory.length > 0 ? { history: formattedHistory } : {})
  });

  const response = await chat.sendMessage({
    message: formattedMessage
  });
  return response.text;
};

export const generateCode = async (language, requirement) => {
  const genai = getAI();
  if (!genai) throw new Error('Gemini API is not configured.');

  const prompt = getGeneratePrompt(language, requirement);
  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { temperature: 0.1 }
  });
  
  return response.text.trim();
};

export const convertCode = async (fromLanguage, toLanguage, code) => {
  const genai = getAI();
  if (!genai) throw new Error('Gemini API is not configured.');

  const prompt = getConvertPrompt(fromLanguage, toLanguage, code);
  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { temperature: 0.1 }
  });
  
  return response.text.trim();
};

export const generateAutocomplete = async (language, problemText, prefix, suffix) => {
  const genai = getAI();
  if (!genai) throw new Error('Gemini API is not configured.');

  const prompt = getAutocompletePrompt(language, problemText, prefix, suffix);
  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { temperature: 0.1 }
  });
  
  return response.text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
};
