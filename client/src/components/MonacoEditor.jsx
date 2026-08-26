import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { generateCode } from '../services/api';

export default function MonacoEditor({ code, setCode, language }) {
  const editorRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addAction({
      id: 'generate-code-from-comment',
      label: 'Generate Code from Comment',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: async (ed) => {
        const position = ed.getPosition();
        const model = ed.getModel();
        const lineContent = model.getLineContent(position.lineNumber);
        
        // Check if it's a comment
        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('#')) {
          const requirement = lineContent.trim().replace(/^(\/\/|#)\s*/, '');
          
          setIsGenerating(true);
          try {
            const response = await generateCode(language, requirement);
            
            if (response.success) {
              const generated = response.code;
              // Insert the code below the current line
              ed.executeEdits('ai-generator', [{
                range: new monaco.Range(position.lineNumber + 1, 1, position.lineNumber + 1, 1),
                text: `${generated}\n`,
                forceMoveMarkers: true
              }]);
            }
          } catch (error) {
            console.error('Generation failed:', error);
          } finally {
            setIsGenerating(false);
          }
        } else {
          alert('Please place cursor on a comment line (// or #) to generate code.');
        }
      }
    });
  };

  return (
    <div className="relative h-full w-full">
      {isGenerating && (
        <div className="absolute top-2 right-6 z-10 bg-[#1f6feb] text-white text-xs px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Generating...
        </div>
      )}
      <Editor
        height="100%"
        language={language === 'cpp' ? 'cpp' : language}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
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
    </div>
  );
}
