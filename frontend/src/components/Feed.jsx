// frontend/src/components/Feed.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ArticleModal from './ArticleModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadFeed() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/feed?limit=20`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch feed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
    // poll feed every 30s for demo freshness
    const id = setInterval(loadFeed, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="feed">
      <div className="controls">
        <button onClick={loadFeed}>Refresh</button>
      </div>

      {loading && <div className="info">Loading feed…</div>}

      <ul className="list">
        {items.map(item => (
          <li key={item.id} className="card" onClick={() => setSelected(item)}>
            <div className="card-left">
              <strong className="title">{item.title}</strong>
              <p className="hook">{item.hook}</p>
              <div className="meta">
                <span>{item.source}</span>
                <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ''}</span>
              </div>
            </div>
            <div className="card-right">
              {item.audio_url ? <span className="ready">Audio</span> : <span className="pending">No audio</span>}
            </div>
          </li>
        ))}
      </ul>

      {selected && <ArticleModal item={selected} onClose={() => setSelected(null)} onDone={() => { loadFeed(); setSelected(null); }} />}
    </div>
  );
}
