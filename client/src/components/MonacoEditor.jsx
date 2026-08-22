import React from 'react';
import Editor from '@monaco-editor/react';

export default function MonacoEditor({ code, setCode, language }) {
  const handleEditorChange = (value) => {
    setCode(value);
  };

  return (
    <Editor
      height="100%"
      language={language === 'cpp' ? 'cpp' : language}
      theme="vs-dark"
      value={code}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
      }}
      loading={<div className="flex items-center justify-center h-full text-[#8b949e]">Loading Editor...</div>}
    />
  );
}
