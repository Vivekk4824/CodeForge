export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (BACKEND_URL ? `${BACKEND_URL}/api` : '/api');

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

export const getInlineCompletion = async (language, problemText, prefix, suffix) => {
  const response = await fetch(`${API_BASE_URL}/ai/autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language, problemText, prefix, suffix }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get inline completion');
  }
  return response.json();
};
