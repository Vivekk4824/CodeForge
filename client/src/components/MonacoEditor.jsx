import React, { useRef, useState, useEffect, memo } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { generateCode, getInlineCompletion } from '../services/api';

const MonacoEditor = memo(function MonacoEditor({ code, setCode, language, problemText, aiCopilotEnabled }) {
  const editorRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const updateTimerRef = useRef(null);
  const monaco = useMonaco();
  const latestProps = useRef({ language, problemText, aiCopilotEnabled });

  // Sync localCode if parent's code changes (e.g. language template switch)
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
    }
  }, [code]);

  useEffect(() => {
    latestProps.current = { language, problemText, aiCopilotEnabled };
  }, [language, problemText, aiCopilotEnabled]);

  useEffect(() => {
    if (!monaco) return;

    let debounceTimer;
    
    const provider = monaco.languages.registerInlineCompletionsProvider('*', {
      provideInlineCompletions: async (model, position, context, token) => {
        const { aiCopilotEnabled, language, problemText } = latestProps.current;
        if (!aiCopilotEnabled) return { items: [] };

        // Only trigger completion automatically or explicitly, but avoid spamming on every keystroke too much.
        const prefix = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
        const suffix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: model.getLineCount(),
          endColumn: model.getLineMaxColumn(model.getLineCount())
        });

        if (!prefix.trim()) return { items: [] };

        return new Promise((resolve) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            if (token.isCancellationRequested) {
              resolve({ items: [] });
              return;
            }
            try {
              const res = await getInlineCompletion(language, problemText, prefix, suffix);
              if (res.success && res.completion) {
                resolve({
                  items: [{
                    insertText: res.completion,
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                  }]
                });
              } else {
                resolve({ items: [] });
              }
            } catch (err) {
              console.error('Autocomplete error:', err);
              resolve({ items: [] });
            }
          }, 800);
        });
      },
      freeInlineCompletions: () => {}
    });

    return () => {
      provider.dispose();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [monaco]);

  const handleEditorChange = (value) => {
    setLocalCode(value);
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      setCode(value);
    }, 400); // Debounce parent sync to avoid heavy Playground re-renders
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
        value={localCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
        inlineSuggest: { enabled: true },
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
});

export default MonacoEditor;
