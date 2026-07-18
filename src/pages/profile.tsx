import { Link } from "react-router-dom";
import { ShieldCheck, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import { shortAddress } from "@/shared/lib/format";
import { useProfile, useHistory } from "@/features/profile";
import { useSession } from "@/store/session";
import { CallRow } from "./history";

export function ProfilePage() {
  const profile = useProfile();
  const history = useHistory();
  const address = useSession((state) => state.address);
  const disconnect = useSession((state) => state.disconnect);
  const me = profile.data;

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-14 border-2 border-lime">
          <AvatarFallback className="bg-card font-display text-lg text-lime">
            {me?.handle.slice(0, 2).toUpperCase() ?? "··"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{me?.handle ?? "Predictor"}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {address ? shortAddress(address) : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Provable accuracy" value={`${me?.accuracy ?? 0}%`} accent />
        <StatCard label="Total calls" value={String(me?.totalCalls ?? 0)} />
        <StatCard label="Global rank" value={`#${me?.rank ?? "—"}`} />
        <StatCard label="Best streak" value={`${me?.bestStreak ?? 0} wins`} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Copy my calls</p>
          <p className="text-xs text-muted-foreground">Let followers mirror your predictions</p>
        </div>
        <Switch />
      </div>

      <Link to="/leaderboard">
        <Button variant="outline" className="w-full border-border">
          <Trophy className="size-4 text-flame" /> Global Leaderboard
        </Button>
      </Link>

      <div className="flex items-center gap-2 pt-1 text-xs font-semibold tracking-widest text-lime">
        <ShieldCheck className="size-4" /> UNFORGEABLE · VERIFIED IMMUTABLE ON-CHAIN DATA
      </div>

      <div className="space-y-2">
        {(history.data ?? []).slice(0, 4).map((prediction) => (
          <CallRow key={prediction.id} prediction={prediction} />
        ))}
        {(history.data?.length ?? 0) > 4 && (
          <Link to="/history" className="block pt-1 text-center text-xs text-lime">
            View all calls →
          </Link>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={disconnect}
        className="w-full text-xs text-muted-foreground"
      >
        Disconnect
      </Button>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3">
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <p className={`font-display text-2xl font-extrabold ${accent ? "text-lime" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
