interface CountdownRingProps {
  seconds: number;
  total: number;
  label?: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({ seconds, total, label }: CountdownRingProps) {
  const progress = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex size-28 items-center justify-center">
      <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--flame)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-foreground font-mono text-2xl font-bold">
          {Math.max(0, Math.ceil(seconds))}
        </span>
        {label && (
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wide">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
