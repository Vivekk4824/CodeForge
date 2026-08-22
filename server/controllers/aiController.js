import { chatWithAI, generateCode, convertCode } from '../services/geminiService.js';

// @desc    Chat with AI
// @route   POST /api/ai/chat
export const handleChat = async (req, res) => {
  const { context, history, userMessage } = req.body;
  
  if (!userMessage) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    const responseText = await chatWithAI(context || {}, history || [], userMessage);
    res.json({ success: true, text: responseText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate code
// @route   POST /api/ai/generate
export const handleGenerate = async (req, res) => {
  const { language, requirement } = req.body;

  try {
    const code = await generateCode(language, requirement);
    res.json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Convert code
// @route   POST /api/ai/convert
export const handleConvert = async (req, res) => {
  const { fromLanguage, toLanguage, code } = req.body;

  try {
    const convertedCode = await convertCode(fromLanguage, toLanguage, code);
    res.json({ success: true, code: convertedCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
