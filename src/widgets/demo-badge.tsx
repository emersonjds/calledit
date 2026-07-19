import { useAppMode } from '@/store/app-mode';

export function DemoBadge() {
  const mode = useAppMode((state) => state.mode);
  const exitDemo = useAppMode((state) => state.exitDemo);
  if (mode !== 'demo') return null;
  return (
    <div className="border-flame/40 bg-card mx-auto mb-2 flex max-w-[430px] items-center justify-between gap-2 rounded-full border px-3 py-1">
      <span className="text-flame text-xs font-semibold">Simulated data · Demo</span>
      <button
        onClick={exitDemo}
        className="text-muted-foreground text-xs underline"
        aria-label="Exit demo"
      >
        Exit
      </button>
    </div>
  );
}
