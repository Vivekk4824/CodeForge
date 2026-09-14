import React, { useState, useEffect } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ProblemPanel from '../components/ProblemPanel';
import InputOutputPanel from '../components/InputOutputPanel';
import AIChat from '../components/AIChat';
import ConvertModal from '../components/ConvertModal';
import { Play, Send, GitCompare, Sparkles } from 'lucide-react';
import { runCode } from '../services/api';

const LANGUAGE_TEMPLATES = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\t// your code goes here\n\treturn 0;\n}',
  java: 'import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n\nclass Main {\n\tpublic static void main (String[] args) throws java.lang.Exception {\n\t\t// your code goes here\n\t}\n}',
  python: '# your code goes here\n',
  javascript: '// your code goes here\n'
};

export default function Playground() {
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.cpp);
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [problemText, setProblemText] = useState(
    "Given an array of integers, find the maximum subarray sum.\n\nConstraints:\n1 <= n <= 10^5\n-10^9 <= arr[i] <= 10^9\n\nExample:\nInput: \n5\n1 2 3 4 5\nOutput: \n15"
  );
  const [aiCopilotEnabled, setAiCopilotEnabled] = useState(false);

  useEffect(() => {
    const javaPattern = /public\s+class\s+|System\.out\.print|import\s+java\./;
    const cppPattern = /#include\s*<|using\s+namespace\s+std;|std::cout/;
    const pythonPattern = /def\s+\w+\s*\(|import\s+(os|sys|math|re)|print\s*\(/;
    const jsPattern = /console\.log|const\s+\w+\s*=|let\s+\w+\s*=|function\s*\(/;

    setLanguage(prev => {
      if (javaPattern.test(code) && prev !== 'java') return 'java';
      if (cppPattern.test(code) && prev !== 'cpp') return 'cpp';
      if (pythonPattern.test(code) && prev !== 'python') return 'python';
      if (jsPattern.test(code) && prev !== 'javascript') return 'javascript';
      return prev;
    });
  }, [code]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    // Only overwrite if the current code is empty, matches one of the templates, or matches the old hardcoded default
    const oldHardcodedDefault = '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
    const isCodeUnmodified = !code.trim() || 
                             code.trim() === oldHardcodedDefault.trim() || 
                             Object.values(LANGUAGE_TEMPLATES).some(t => t.trim() === code.trim());
    
    if (isCodeUnmodified) {
      setCode(LANGUAGE_TEMPLATES[newLang]);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');
    try {
      const response = await runCode(language, code, input);
      if (response.success) {
        setOutput(response.output || '');
      } else {
        setOutput(response.error || 'Execution failed.');
      }
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Left Panel: Problem */}
      <div className="w-1/3 border-r border-[#30363d] bg-[#0d1117] flex flex-col h-full">
        <ProblemPanel problemText={problemText} setProblemText={setProblemText} />
      </div>

      {/* Right Panel: Editor & I/O */}
      <div className="w-2/3 flex flex-col h-full bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8b949e]">Language:</span>
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded px-2 py-1 text-sm outline-none focus:border-[#58a6ff]"
            >
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowConvertModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] hover:border-[#8b949e] transition-all"
            >
              <GitCompare size={14} />
              Convert
            </button>
            <button 
              onClick={() => setAiCopilotEnabled(!aiCopilotEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${aiCopilotEnabled ? 'bg-[#1f6feb] text-white border-[rgba(240,246,252,0.1)]' : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e]'} border rounded-md transition-all`}
              title="Toggle AI Auto-Hints (Copilot)"
            >
              <Sparkles size={14} className={aiCopilotEnabled ? 'text-yellow-300' : ''} />
              Auto-Hints {aiCopilotEnabled ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setShowChat(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1f6feb] border border-[rgba(240,246,252,0.1)] rounded-md hover:bg-[#388bfd] transition-all text-white"
            >
              <Send size={14} />
              Ask AI
            </button>
            <button 
              onClick={handleRunCode}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${isRunning ? 'bg-[#1b5e20]' : 'bg-[#238636] hover:bg-[#2ea043]'} border border-[rgba(240,246,252,0.1)] rounded-md transition-all text-white font-medium ml-2`}
            >
              <Play size={14} fill="currentColor" />
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 min-h-[40%]">
          <MonacoEditor 
            code={code} 
            setCode={setCode} 
            language={language} 
            problemText={problemText}
            aiCopilotEnabled={aiCopilotEnabled}
          />
        </div>

        {/* Input/Output Panel */}
        <div className="h-1/3 min-h-[200px] border-t border-[#30363d]">
          <InputOutputPanel input={input} setInput={setInput} output={output} />
        </div>
      </div>

      {showChat && <AIChat onClose={() => setShowChat(false)} codeContext={code} />}
      <ConvertModal 
        isOpen={showConvertModal} 
        onClose={() => setShowConvertModal(false)}
        currentLanguage={language}
        code={code}
        setCode={setCode}
      />
    </div>
  );
}
