import React, { useState } from 'react';

export default function InputOutputPanel({ input, setInput, output }) {
  const [activeTab, setActiveTab] = useState('input');

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div className="flex border-b border-[#30363d] bg-[#161b22]">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'input' ? 'border-[#58a6ff] text-[#c9d1d9]' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Input
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'output' ? 'border-[#58a6ff] text-[#c9d1d9]' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Output
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'errors' ? 'border-[#f85149] text-[#c9d1d9]' : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Errors
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'input' && (
          <textarea
            className="w-full h-full bg-transparent text-[#c9d1d9] font-mono text-sm resize-none outline-none"
            placeholder="Enter custom stdin here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
          />
        )}
        {activeTab === 'output' && (
          <pre className="text-[#c9d1d9] font-mono text-sm whitespace-pre-wrap">
            {output || 'No output yet.'}
          </pre>
        )}
        {activeTab === 'errors' && (
          <pre className="text-[#f85149] font-mono text-sm whitespace-pre-wrap">
            No errors.
          </pre>
        )}
      </div>
    </div>
  );
}
