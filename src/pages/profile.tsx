import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Copy, Flame, LogOut, ShieldCheck, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { DataNote } from '@/shared/ui/data-note';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { formatSol, shortAddress } from '@/shared/lib/format';
import { getMode, isDemo } from '@/shared/config';
import { useProfile, useHistory } from '@/features/profile';
import { useOnchainBalance } from '@/features/wallet';
import { useSession } from '@/store/session';
import { CallRow } from './history';

export function ProfilePage() {
  const profile = useProfile();
  const history = useHistory();
  const address = useSession((state) => state.address);
  const chain = useSession((state) => state.chain);
  const disconnect = useSession((state) => state.disconnect);
  const me = profile.data;
  const demo = getMode() === 'demo';
  const recent = (history.data ?? []).slice(0, 3);

  const showOnchainBalance = chain === 'solana' && !isDemo();
  const onchainBalance = useOnchainBalance(address, showOnchainBalance);
  const walletBalanceLabel =
    chain === 'evm'
      ? 'EVM address — no SOL balance'
      : formatSol(onchainBalance.data ?? me?.balanceSol ?? 0);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success('Address copied');
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <header className="flex items-center gap-3">
        <Avatar className="border-lime size-14 border-2">
          <AvatarImage src="https://i.pravatar.cc/150?img=68" alt={me?.handle ?? 'You'} />
          <AvatarFallback className="bg-card font-display text-lime text-lg">
            {me?.handle.slice(0, 2).toUpperCase() ?? '··'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="font-display text-lg font-bold">{me?.handle ?? 'Predictor'}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-flame border-flame/40 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              <Flame className="size-3" /> {me?.currentStreak ?? 0} win streak
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                demo ? 'text-flame border-flame/40' : 'text-lime border-lime/40'
              }`}
            >
              {demo ? 'Demo · simulated' : 'On-chain verified'}
            </span>
          </div>
        </div>
      </header>

      <Section label="Solana wallet">
        <div className="border-border bg-card flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <div className="min-w-0">
            <p className="text-foreground font-mono text-sm">
              {address ? shortAddress(address) : '—'}
            </p>
            <p className="text-muted-foreground text-xs">{walletBalanceLabel}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Copy address"
            onClick={copyAddress}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </Section>

      <Section label="Your record">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Accuracy" value={`${Math.round((me?.accuracy ?? 0) * 100)}%`} accent />
          <StatCard label="Calls won" value={`${me?.wonCalls ?? 0}/${me?.totalCalls ?? 0}`} />
          <StatCard label="Global rank" value={`#${me?.rank ?? '—'}`} />
          <StatCard label="Best streak" value={`${me?.bestStreak ?? 0} wins`} />
        </div>
        {getMode() === 'live' && (
          <DataNote>Stats are placeholder backend values, not yet computed.</DataNote>
        )}
      </Section>

      <Section
        label="Recent calls"
        action={
          (history.data?.length ?? 0) > 3 ? (
            <Link to="/history" className="text-lime text-xs">
              View all →
            </Link>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {recent.length ? (
            recent.map((prediction) => <CallRow key={prediction.id} prediction={prediction} />)
          ) : (
            <p className="text-muted-foreground bg-card border-border rounded-xl border px-4 py-6 text-center text-sm">
              No calls yet — make your first one.
            </p>
          )}
        </div>
      </Section>

      <Section label="Settings">
        <div className="border-border bg-card divide-border divide-y rounded-xl border">
          <SettingRow title="Copy my calls" hint="Let followers mirror your predictions">
            <Switch />
          </SettingRow>
          <SettingRow title="Goal alerts" hint="Notify me when a challenge opens">
            <Switch defaultChecked />
          </SettingRow>
          <Link
            to="/leaderboard"
            className="hover:bg-background/40 flex items-center gap-3 px-4 py-3 transition-colors"
          >
            <Trophy className="text-flame size-4 shrink-0" />
            <span className="flex-1 text-sm font-semibold">Global leaderboard</span>
            <ChevronRight className="text-muted-foreground size-4" />
          </Link>
        </div>

        <Button
          variant="ghost"
          onClick={disconnect}
          className="text-muted-foreground hover:text-flame w-full"
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </Section>

      <div className="text-lime flex items-center justify-center gap-2 pt-1 text-center text-[10px] font-semibold tracking-widest">
        <ShieldCheck className="size-4 shrink-0" /> UNFORGEABLE · VERIFIED ON-CHAIN
      </div>
    </div>
  );
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </p>
        {action}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border px-3 py-3">
      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">{label}</p>
      <p
        className={`font-display text-2xl font-extrabold ${accent ? 'text-lime' : 'text-foreground'}`}
      >
        {value}
      </p>
    </div>
  );
}
