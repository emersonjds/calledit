import { Link } from 'react-router-dom';
import { ShieldCheck, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { shortAddress } from '@/shared/lib/format';
import { useProfile, useHistory } from '@/features/profile';
import { useSession } from '@/store/session';
import { CallRow } from './history';

export function ProfilePage() {
  const profile = useProfile();
  const history = useHistory();
  const address = useSession((state) => state.address);
  const disconnect = useSession((state) => state.disconnect);
  const me = profile.data;

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="border-lime size-14 border-2">
          <AvatarImage src="https://i.pravatar.cc/150?img=68" alt={me?.handle ?? 'You'} />
          <AvatarFallback className="bg-card font-display text-lime text-lg">
            {me?.handle.slice(0, 2).toUpperCase() ?? '··'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{me?.handle ?? 'Predictor'}</p>
          <p className="text-muted-foreground font-mono text-xs">
            {address ? shortAddress(address) : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Provable accuracy" value={`${me?.accuracy ?? 0}%`} accent />
        <StatCard label="Total calls" value={String(me?.totalCalls ?? 0)} />
        <StatCard label="Global rank" value={`#${me?.rank ?? '—'}`} />
        <StatCard label="Best streak" value={`${me?.bestStreak ?? 0} wins`} />
      </div>

      <div className="border-border bg-card flex items-center justify-between rounded-xl border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Copy my calls</p>
          <p className="text-muted-foreground text-xs">Let followers mirror your predictions</p>
        </div>
        <Switch />
      </div>

      <Link to="/leaderboard">
        <Button variant="outline" className="border-border w-full">
          <Trophy className="text-flame size-4" /> Global Leaderboard
        </Button>
      </Link>

      <div className="text-lime flex items-center gap-2 pt-1 text-xs font-semibold tracking-widest">
        <ShieldCheck className="size-4" /> UNFORGEABLE · VERIFIED IMMUTABLE ON-CHAIN DATA
      </div>

      <div className="space-y-2">
        {(history.data ?? []).slice(0, 4).map((prediction) => (
          <CallRow key={prediction.id} prediction={prediction} />
        ))}
        {(history.data?.length ?? 0) > 4 && (
          <Link to="/history" className="text-lime block pt-1 text-center text-xs">
            View all calls →
          </Link>
        )}
      </div>

      <Button variant="ghost" onClick={disconnect} className="text-muted-foreground w-full text-xs">
        Disconnect
      </Button>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border px-3 py-3">
      <p className="text-muted-foreground text-[10px] tracking-widest">{label.toUpperCase()}</p>
      <p
        className={`font-display text-2xl font-extrabold ${accent ? 'text-lime' : 'text-foreground'}`}
      >
        {value}
      </p>
    </div>
  );
}
