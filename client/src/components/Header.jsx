import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="h-16 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex flex-col justify-center">
            <div className="text-2xl font-black tracking-tight leading-none">
              <span className="text-white">Code</span>
              <span className="text-[#ff8c00]">Forge</span>
            </div>
            <span className="text-[#8b949e] text-[0.55rem] tracking-[0.2em] font-bold mt-1 uppercase">
              Competitive Programming IDE
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm ml-4">
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
