import { executeCode } from '../services/codeExecutor.js';

// @desc    Run code
// @route   POST /api/code/run
export const runCode = async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ success: false, message: 'Language and code are required' });
  }

  try {
    const result = await executeCode(language, code, input || '');
    
    // For MVP, we don't save anonymous runs to history. 
    // If the user is authenticated, we could save it here (will implement in Phase 8).
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
