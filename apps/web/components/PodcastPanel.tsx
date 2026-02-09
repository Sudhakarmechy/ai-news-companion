'use client';

import { usePlayerStore } from '../lib/store';

export function PodcastPanel() {
  const { isPlaying, mode, toggleDepth, togglePlayback } = usePlayerStore();

  return (
    <section className="rounded-2xl bg-slate-900/80 p-5 shadow-xl">
      <p className="text-xs uppercase tracking-widest text-violet-300">Live AI Anchor</p>
      <h2 className="mt-2 text-xl font-semibold">Global Pulse Stream</h2>
      <p className="mt-2 text-sm text-slate-300">Continuous personalized narration with conversational interruption support.</p>
      <div className="mt-4 flex gap-3">
        <button className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium" onClick={togglePlayback}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="rounded-full border border-slate-600 px-4 py-2 text-sm" onClick={toggleDepth}>
          {mode === 'brief' ? 'Switch to Detailed' : 'Switch to Brief'}
        </button>
      </div>
    </section>
  );
}
