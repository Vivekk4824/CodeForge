import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export default function AIChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI coding assistant. How can I help you with your code today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    // TODO: Connect to backend API
    setInput('');
  };

  return (
    <div className="w-96 bg-[#161b22] border-l border-[#30363d] flex flex-col h-full absolute right-0 top-0 z-50 shadow-2xl">
      <div className="h-14 border-b border-[#30363d] flex items-center justify-between px-4 shrink-0 bg-[#0d1117]">
        <h2 className="text-[#c9d1d9] font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
          AI Assistant
        </h2>
        <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-[#1f6feb] text-white' 
                : 'bg-[#21262d] border border-[#30363d] text-[#c9d1d9]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#30363d] bg-[#0d1117]">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your code..."
            className="w-full bg-[#21262d] border border-[#30363d] rounded-full pl-4 pr-10 py-2 text-sm text-[#c9d1d9] outline-none focus:border-[#58a6ff]"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors p-1"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
