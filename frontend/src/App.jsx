// frontend/src/App.jsx
import React from 'react';
import Feed from './components/Feed';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>AI News Companion — Demo</h1>
        <p className="sub">Fetch → Summarize → Voice (demo)</p>
      </header>

      <main className="main">
        <Feed />
      </main>

      <footer className="footer">
        <small>Dev build — not for production</small>
      </footer>
    </div>
  );
}
