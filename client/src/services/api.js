const API_BASE_URL = 'http://localhost:5000/api';

export const runCode = async (language, code, input) => {
  const response = await fetch(`${API_BASE_URL}/code/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language, code, input }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to run code');
  }
  return response.json();
};

export const chatWithAI = async (context, history, userMessage) => {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context, history, userMessage }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to communicate with AI');
  }
  return response.json();
};

export const generateCode = async (language, requirement) => {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language, requirement }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate code');
  }
  return response.json();
};

export const convertCode = async (fromLanguage, toLanguage, code) => {
  const response = await fetch(`${API_BASE_URL}/ai/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fromLanguage, toLanguage, code }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to convert code');
  }
  return response.json();
};
