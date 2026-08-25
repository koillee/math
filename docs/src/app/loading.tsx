export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f6f0e5] p-5 md:p-8" aria-busy="true" aria-label="Loading MasteryOS Math">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-24 rounded-[2rem] bg-white/70" />
        <div className="grid gap-5 md:grid-cols-3">
          <div className="h-32 rounded-[1.5rem] bg-white/70" />
          <div className="h-32 rounded-[1.5rem] bg-white/70" />
          <div className="h-32 rounded-[1.5rem] bg-white/70" />
        </div>
        <div className="h-64 rounded-[1.5rem] bg-[#10211f]/10" />
      </div>
    </main>
  );
}