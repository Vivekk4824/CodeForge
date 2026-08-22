import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Playground from './pages/Playground';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] font-sans">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Playground />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
