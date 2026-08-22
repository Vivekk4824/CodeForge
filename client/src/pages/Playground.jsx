import React, { useState } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ProblemPanel from '../components/ProblemPanel';
import InputOutputPanel from '../components/InputOutputPanel';
import AIChat from '../components/AIChat';
import ConvertModal from '../components/ConvertModal';
import { Play, Send, GitCompare } from 'lucide-react';

export default function Playground() {
  const [code, setCode] = useState('#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}');
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Left Panel: Problem */}
      <div className="w-1/3 border-r border-[#30363d] bg-[#0d1117] flex flex-col h-full">
        <ProblemPanel />
      </div>

      {/* Right Panel: Editor & I/O */}
      <div className="w-2/3 flex flex-col h-full bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8b949e]">Language:</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              onClick={() => setShowChat(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1f6feb] border border-[rgba(240,246,252,0.1)] rounded-md hover:bg-[#388bfd] transition-all text-white"
            >
              <Send size={14} />
              Ask AI
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#238636] border border-[rgba(240,246,252,0.1)] rounded-md hover:bg-[#2ea043] transition-all text-white font-medium ml-2">
              <Play size={14} fill="currentColor" />
              Run
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 min-h-[40%]">
          <MonacoEditor code={code} setCode={setCode} language={language} />
        </div>

        {/* Input/Output Panel */}
        <div className="h-1/3 min-h-[200px] border-t border-[#30363d]">
          <InputOutputPanel input={input} setInput={setInput} output={output} />
        </div>
      </div>

      {showChat && <AIChat onClose={() => setShowChat(false)} />}
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
