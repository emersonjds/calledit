import { Check } from "lucide-react";
import { formatTimeOfDay } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

interface OnchainSealProps {
  verified?: boolean;
  stampedAt?: number;
  size?: number;
}

export function OnchainSeal({ verified = false, stampedAt, size = 96 }: OnchainSealProps) {
  const color = verified ? "var(--lime)" : "var(--muted-foreground)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn("relative flex items-center justify-center rounded-full", verified && "glow-lime")}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="1.5" />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill={verified ? "color-mix(in srgb, var(--lime) 12%, transparent)" : "transparent"}
            stroke={color}
            strokeWidth="3"
          />
        </svg>
        <Check
          className="absolute"
          style={{ color, width: size * 0.32, height: size * 0.32 }}
          strokeWidth={3}
        />
      </div>
      {stampedAt !== undefined && (
        <span className="font-mono text-[11px] text-muted-foreground">{formatTimeOfDay(stampedAt)}</span>
      )}
    </div>
  );
}
