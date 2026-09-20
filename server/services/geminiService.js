import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, getChatPrompt, getGeneratePrompt, getConvertPrompt, getAutocompletePrompt } from '../utils/prompts.js';

let ai = null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const USE_MOCK_AI = process.env.MOCK_AI === 'true';

const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

export const chatWithAI = async (context, history, userMessage) => {
  if (USE_MOCK_AI) {
    return `[Mock AI Assistant]: For this problem in ${context?.language || 'C++'}, an optimal approach is using Kadane's algorithm to compute maximum subarray sum in O(N) time and O(1) space.`;
  }

  const genai = getAI();
  if (!genai) {
    return `[Mock AI Assistant]: Gemini API key is not configured. Here is a simulated response for: "${userMessage}".`;
  }

  try {
    const formattedMessage = getChatPrompt(context, userMessage);
    
    // Format history for the API:
    // Gemini requires history to start with a 'user' turn and alternate between 'user' and 'model'
    const formattedHistory = [];
    for (const msg of history || []) {
      const role = msg.role === 'ai' ? 'model' : 'user';
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
  } catch (error) {
    // If quota is exhausted or API is rate-limited, gracefully return mock response rather than failing
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      console.warn('[GeminiService] Quota exceeded. Falling back to mock response for testing.');
      return `[Mock AI Assistant (Quota Fallback)]: Kadane's Algorithm maintains a running sum of the current subarray and resets it to 0 if it becomes negative, achieving O(N) time complexity.`;
    }
    throw error;
  }
};

export const generateCode = async (language, requirement) => {
  if (USE_MOCK_AI) {
    return `// Mock generated code for: ${requirement}\nint findMax(int arr[], int n) {\n    int maxVal = arr[0];\n    for (int i = 1; i < n; i++) if (arr[i] > maxVal) maxVal = arr[i];\n    return maxVal;\n}`;
  }

  const genai = getAI();
  if (!genai) {
    return `// Mock code: Gemini API not configured\n`;
  }

  try {
    const prompt = getGeneratePrompt(language, requirement);
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.1 }
    });
    
    return response.text.trim();
  } catch (error) {
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      return `// Mock Code (Quota Fallback):\nint findMax(int arr[], int n) {\n    int maxVal = arr[0];\n    for (int i = 1; i < n; i++) if (arr[i] > maxVal) maxVal = arr[i];\n    return maxVal;\n}`;
    }
    throw error;
  }
};

export const convertCode = async (fromLanguage, toLanguage, code) => {
  if (USE_MOCK_AI) {
    return `// Mock converted code from ${fromLanguage} to ${toLanguage}\n${code}`;
  }

  const genai = getAI();
  if (!genai) {
    return `// Mock converted code (API not configured)\n${code}`;
  }

  try {
    const prompt = getConvertPrompt(fromLanguage, toLanguage, code);
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.1 }
    });
    
    return response.text.trim();
  } catch (error) {
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      return `// Mock converted code from ${fromLanguage} to ${toLanguage}\n${code}`;
    }
    throw error;
  }
};

export const generateAutocomplete = async (language, problemText, prefix, suffix) => {
  if (USE_MOCK_AI) {
    return `// suggested completion`;
  }

  const genai = getAI();
  if (!genai) return '';

  try {
    const prompt = getAutocompletePrompt(language, problemText, prefix, suffix);
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { temperature: 0.1 }
    });
    
    return response.text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
  } catch (error) {
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      return '';
    }
    throw error;
  }
};
