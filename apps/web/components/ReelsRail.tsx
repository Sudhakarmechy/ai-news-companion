const sampleCards = [
  { headline: 'AI chip supply race heats up', category: 'technology' },
  { headline: 'Markets react to inflation surprise', category: 'finance' },
  { headline: 'Climate summit announces joint roadmap', category: 'world' }
];

export function ReelsRail() {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-lg font-semibold">Short News Reels</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {sampleCards.map((card) => (
          <article key={card.headline} className="min-w-52 rounded-xl bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400">{card.category}</p>
            <p className="mt-1 text-sm font-medium">{card.headline}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
