'use client';

import { create } from 'zustand';

type PlayerState = {
  isPlaying: boolean;
  mode: 'brief' | 'detailed';
  togglePlayback: () => void;
  toggleDepth: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: true,
  mode: 'brief',
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleDepth: () => set((state) => ({ mode: state.mode === 'brief' ? 'detailed' : 'brief' }))
}));
