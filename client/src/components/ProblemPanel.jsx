import React, { useState } from 'react';

export default function ProblemPanel({ problemText, setProblemText }) {

  return (
    <div className="flex flex-col h-full">
      <div className="h-12 border-b border-[#30363d] flex items-center px-4 shrink-0 bg-[#161b22]">
        <h2 className="text-[#c9d1d9] font-medium text-sm">Problem Description</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          className="w-full h-full bg-transparent text-[#c9d1d9] text-sm resize-none outline-none font-sans"
          placeholder="Paste problem statement, constraints, and examples here..."
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
