import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, getChatPrompt, getGeneratePrompt, getConvertPrompt } from '../utils/prompts.js';

let ai = null;

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
  
  // Format history for the API
  // history should be array of { role: 'user'|'model', parts: [{text: '...'}] }
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const chat = genai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
    },
    history: formattedHistory
  });

  const response = await chat.sendMessage(formattedMessage);
  return response.text;
};

export const generateCode = async (language, requirement) => {
  const genai = getAI();
  if (!genai) throw new Error('Gemini API is not configured.');

  const prompt = getGeneratePrompt(language, requirement);
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.1 }
  });
  
  return response.text.trim();
};
