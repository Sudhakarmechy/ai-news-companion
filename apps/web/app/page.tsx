import { PodcastPanel } from '../components/PodcastPanel';
import { ReelsRail } from '../components/ReelsRail';

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-violet-300">AI News Companion</p>
        <h1 className="text-3xl font-bold">Your live global news co-host</h1>
        <p className="mt-2 text-sm text-slate-300">Spotify-style AI podcast stream with Inshorts-like reels and premium personalization.</p>
      </header>
      <PodcastPanel />
      <ReelsRail />
    </main>
  );
}
