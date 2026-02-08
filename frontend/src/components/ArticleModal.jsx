// frontend/src/components/ArticleModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// small exponential backoff polling helper
async function pollForAudio(articleId, onUpdate, maxAttempts = 12) {
  let attempt = 0;
  let delay = 2000;
  while (attempt < maxAttempts) {
    try {
      const res = await axios.get(`${API_BASE}/article/${encodeURIComponent(articleId)}`);
      const audio = res.data.audio_url;
      if (audio) {
        onUpdate({ status: 'ready', audio_url: audio });
        return;
      } else {
        onUpdate({ status: 'processing' });
      }
    } catch (err) {
      console.error('poll error', err);
      onUpdate({ status: 'error', error: err.message });
    }
    attempt += 1;
    await new Promise(r => setTimeout(r, delay));
    delay = Math.min(30000, Math.floor(delay * 1.8)); // increase but cap at 30s
  }
  onUpdate({ status: 'timeout' });
}

export default function ArticleModal({ item, onClose, onDone }) {
  const [state, setState] = useState({ status: item.audio_url ? 'ready' : 'idle', audio_url: item.audio_url || null });
  const [humor, setHumor] = useState(4);
  const audioRef = useRef();
  const [voices, setVoices] = useState([]);
  const [voice, setVoice] = useState(''); // will hold voice id
  const [force, setForce] = useState(false);

 useEffect(() => {
    // load available voices
    async function loadVoices() {
      try {
        const res = await axios.get(`${API_BASE}/voices`);
        const v = res.data.voices || [];
        setVoices(v);
        if (v.length > 0) setVoice(v[0].id); // default to first voice id
      } catch (err) {
        console.error('Failed to load voices', err);
        // fallback to the old default id if necessary
        setVoice('2EiwWnXFnvU5JabPnv8n');
      }
    }
    loadVoices();
  }, []);

  useEffect(() => {
    if (state.status === 'ready' && state.audio_url) {
      // auto play
      if (audioRef.current) {
        audioRef.current.src = state.audio_url;
        audioRef.current.play().catch(()=>{});
      }
    }
  }, [state]);

  async function handlePlay() {
    if (state.status === 'ready' && state.audio_url) {
      // already ready, just play
      audioRef.current.play().catch(()=>{});
      return;
    }

    try {
      setState({ status: 'enqueuing' });
      const res = await axios.post(`${API_BASE}/play`, {
  article_id: item.id,
  voice_preset: voice,
  humor_level: humor,
  force
});
      
      // expected: queued response
      setState({ status: 'queued', jobId: res.data.jobId });
      // start polling
      pollForAudio(item.id, (update) => {
        setState(prev => ({ ...prev, ...update }));
      });
    } catch (err) {
      console.error('Play request failed', err);
      setState({ status: 'error', error: err.message || String(err) });
    }
  }

  return (
    <div className="modal">
      <div className="modal-card">
        <header className="modal-header">
          <h3>{item.title}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <p className="summary">{item.summary}</p>
          <div className="controls-row">
   
    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
  <label>Voice:
    <select value={voice} onChange={e => setVoice(e.target.value)}>
      {voices.length === 0 ? <option value="2Eiw...">Default</option> : voices.map(v => (
        <option key={v.id} value={v.id}>{v.name}</option>
      ))}
    </select>
  </label>
<label><input type="checkbox" checked={force} onChange={e=>setForce(e.target.checked)} /> Force regenerate</label>
  <div style={{ color:'#9ca3af', fontSize:12 }}>
    Selected: {voices.find(v => v.id === voice)?.name || voice}
  </div>
</div>

            <label>Humor:
              <input type="range" min="0" max="10" value={humor} onChange={e => setHumor(Number(e.target.value))} />
              <span>{humor}</span>
            </label>

            <button onClick={handlePlay} className="btn-primary">
              {state.status === 'ready' ? 'Play Audio' : 'Generate & Play'}
            </button>
          </div>

          <div className="status-row">
            <strong>Status:</strong> {state.status}
            {state.jobId ? <span> • job {state.jobId}</span> : null}
            {state.error ? <div className="error">{state.error}</div> : null}
          </div>

          <div className="audio-player">
            <audio ref={audioRef} controls style={{ width: '100%' }}>
              <source src={state.audio_url || ''} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>

        <footer className="modal-footer">
          <button onClick={onDone}>Done</button>
        </footer>
      </div>
    </div>
  );
}
