import React, { useState } from 'react';
import { X, GitCompare } from 'lucide-react';

export default function ConvertModal({ isOpen, onClose, currentLanguage, code, setCode }) {
  const [targetLanguage, setTargetLanguage] = useState(currentLanguage === 'cpp' ? 'java' : 'cpp');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedCode, setConvertedCode] = useState('');

  if (!isOpen) return null;

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      // Fake API call for now. Need to wire with backend.
      // const res = await fetch('/api/ai/convert', { ... })
      setTimeout(() => {
        setConvertedCode('// Converted code will appear here\n' + code);
        setIsConverting(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsConverting(false);
    }
  };

  const handleApply = () => {
    setCode(convertedCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 shrink-0 bg-[#0d1117] rounded-t-xl">
          <h2 className="text-[#c9d1d9] font-medium flex items-center gap-2">
            <GitCompare size={18} className="text-[#58a6ff]" />
            Convert Code
          </h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8b949e]">From:</span>
              <span className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm uppercase">
                {currentLanguage}
              </span>
            </div>
            <GitCompare size={16} className="text-[#8b949e]" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8b949e]">To:</span>
              <select 
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded px-3 py-1 text-sm outline-none focus:border-[#58a6ff] uppercase"
              >
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            
            <button 
              onClick={handleConvert}
              disabled={isConverting || currentLanguage === targetLanguage}
              className="ml-auto px-4 py-1.5 bg-[#1f6feb] text-white rounded-md font-medium hover:bg-[#388bfd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConverting ? 'Converting...' : 'Convert Code'}
            </button>
          </div>

          <div className="flex gap-4 min-h-[300px]">
            <div className="w-1/2 flex flex-col gap-2">
              <span className="text-sm text-[#8b949e] font-medium">Original ({currentLanguage})</span>
              <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md p-4 overflow-auto">
                <pre className="text-[#c9d1d9] text-sm font-mono">{code}</pre>
              </div>
            </div>
            <div className="w-1/2 flex flex-col gap-2">
              <span className="text-sm text-[#8b949e] font-medium">Converted ({targetLanguage})</span>
              <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md p-4 overflow-auto">
                <pre className="text-[#c9d1d9] text-sm font-mono">{convertedCode || 'Click Convert to generate code.'}</pre>
              </div>
            </div>
          </div>
        </div>

        {convertedCode && (
          <div className="h-16 border-t border-[#30363d] flex items-center justify-end px-6 shrink-0 bg-[#0d1117] rounded-b-xl gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#c9d1d9] hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handleApply} className="px-4 py-2 text-sm bg-[#238636] text-white rounded-md font-medium hover:bg-[#2ea043] transition-colors">
              Use Converted Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
