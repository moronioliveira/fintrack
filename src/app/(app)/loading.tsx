export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="mb-6 h-8 w-56 rounded-lg bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 rounded-2xl bg-surface-2" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-surface-2 lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
