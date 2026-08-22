import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg hover:text-[#58a6ff] transition-colors">
          <Terminal size={20} className="text-[#58a6ff]" />
          <span>Antigravity</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-[#c9d1d9] hover:text-white transition-colors">Playground</Link>
          <button className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors cursor-not-allowed" title="Coming soon">Problems</button>
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button className="text-[#c9d1d9] hover:text-white transition-colors">History</button>
        <button className="px-3 py-1.5 bg-[#238636] text-white rounded-md font-medium hover:bg-[#2ea043] transition-colors">
          Sign In
        </button>
      </div>
    </header>
  );
}
