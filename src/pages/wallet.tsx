import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataNote } from '@/shared/ui/data-note';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet as WalletIcon,
  Landmark,
  Check,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { cn } from '@/shared/lib/utils';
import { formatFiat, formatSol, formatTimeOfDay } from '@/shared/lib/format';
import { useDeposit, useOnchainBalance, useWalletOverview, useWithdraw } from '@/features/wallet';
import type { ActivityType, WalletActivity, WalletOverview } from '@/entities/wallet';
import { useSession } from '@/store/session';
import { isDemo } from '@/shared/config';

type SheetMode = 'cash-out' | 'add-funds' | null;
type PayoutMethod = 'PIX' | 'Bank transfer';

const CASH_OUT_FEE_RATE = 0.015;

function parseAmount(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function WalletPage() {
  const wallet = useWalletOverview();
  const navigate = useNavigate();
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const overview = wallet.data;

  const chain = useSession((state) => state.chain);
  const address = useSession((state) => state.address);
  const showOnchainBalance = chain === 'solana' && !isDemo();
  const onchainBalance = useOnchainBalance(address, showOnchainBalance);
  const liveBalanceSol = showOnchainBalance ? onchainBalance.data : undefined;

  return (
    <div className="space-y-4 px-4 py-4">
      <DataNote>
        {liveBalanceSol !== undefined
          ? 'Balance is your real on-chain SOL. Activity is a placeholder backend value in live mode.'
          : 'Balance and activity are placeholder backend values in live mode.'}
      </DataNote>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="text-muted-foreground hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Wallet</h1>
      </div>

      {wallet.isLoading || !overview ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <BalanceHero overview={overview} liveBalanceSol={liveBalanceSol} />

          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => setSheetMode('cash-out')}
              className="bg-flame text-background hover:bg-flame/90 h-14 gap-1.5 text-base font-bold"
            >
              <ArrowUpFromLine className="size-4" /> Cash out
            </Button>
            <Button
              size="lg"
              onClick={() => setSheetMode('add-funds')}
              className="bg-lime text-background hover:bg-lime/90 h-14 gap-1.5 text-base font-bold"
            >
              <ArrowDownToLine className="size-4" /> Add funds
            </Button>
          </div>

          <div className="border-border bg-card text-muted-foreground flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs">
            <Landmark className="text-lime mt-0.5 size-3.5 shrink-0" />
            <p>
              SOL is converted to {overview.currency} via a licensed ramp partner and settled to
              your bank. Non-custodial.
            </p>
          </div>

          <ActivityList activity={overview.activity} />

          <CashOutSheet
            open={sheetMode === 'cash-out'}
            onOpenChange={(open) => setSheetMode(open ? 'cash-out' : null)}
            balanceSol={overview.balanceSol}
            fiatRate={overview.fiatRate}
            currency={overview.currency}
          />
          <AddFundsSheet
            open={sheetMode === 'add-funds'}
            onOpenChange={(open) => setSheetMode(open ? 'add-funds' : null)}
            fiatRate={overview.fiatRate}
            currency={overview.currency}
          />
        </>
      )}
    </div>
  );
}

interface BalanceHeroProps {
  overview: WalletOverview;
  /** Real on-chain SOL for the connected Solana address in live mode; undefined falls back to the stub. */
  liveBalanceSol?: number;
}

function BalanceHero({ overview, liveBalanceSol }: BalanceHeroProps) {
  const balanceSol = liveBalanceSol ?? overview.balanceSol;
  return (
    <div className="border-lime/40 bg-card glow-lime rounded-2xl border px-5 py-6 text-center">
      <p className="text-muted-foreground text-[11px] tracking-widest">
        {liveBalanceSol !== undefined ? 'ON-CHAIN BALANCE' : 'TOTAL BALANCE'}
      </p>
      <p className="text-lime mt-1 font-mono text-4xl font-bold">{formatSol(balanceSol)}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        ≈ {formatFiat(balanceSol * overview.fiatRate, overview.currency)}
      </p>
      <p className="text-muted-foreground mt-3 font-mono text-[11px]">
        1 SOL ≈ {formatFiat(overview.fiatRate, overview.currency)}
      </p>
    </div>
  );
}

interface ActivityListProps {
  activity: WalletActivity[];
}

function ActivityList({ activity }: ActivityListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-widest">ACTIVITY</h2>
      {activity.length === 0 ? (
        <p className="text-muted-foreground pt-6 text-center text-sm">
          No activity yet. Add funds to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {activity.map((item) => (
            <ActivityRow key={item.id} activity={item} />
          ))}
        </div>
      )}
    </div>
  );
}

const ACTIVITY_META: Record<
  ActivityType,
  {
    label: string;
    icon: typeof ArrowDownToLine;
    iconClass: string;
    amountClass: string;
    sign: '+' | '−';
  }
> = {
  deposit: {
    label: 'Added funds',
    icon: ArrowDownToLine,
    iconClass: 'text-lime',
    amountClass: 'text-lime',
    sign: '+',
  },
  withdraw: {
    label: 'Cash out',
    icon: ArrowUpFromLine,
    iconClass: 'text-flame',
    amountClass: 'text-flame',
    sign: '−',
  },
  payout: {
    label: 'Prediction payout',
    icon: Check,
    iconClass: 'text-lime',
    amountClass: 'text-lime',
    sign: '+',
  },
  stake: {
    label: 'Call staked',
    icon: WalletIcon,
    iconClass: 'text-muted-foreground',
    amountClass: 'text-muted-foreground',
    sign: '−',
  },
};

interface ActivityRowProps {
  activity: WalletActivity;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const meta = ACTIVITY_META[activity.type];
  const Icon = meta.icon;

  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <span
        className={cn(
          'bg-background flex size-9 shrink-0 items-center justify-center rounded-full',
          meta.iconClass,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{meta.label}</p>
        <p className="text-muted-foreground truncate text-xs">
          {activity.method ?? '—'} · {formatTimeOfDay(activity.ts)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn('font-mono text-sm font-semibold', meta.amountClass)}>
          {meta.sign}
          {formatSol(activity.amountSol)}
        </span>
        <Badge
          variant="outline"
          className={cn(
            'px-1.5 py-0 text-[10px]',
            activity.status === 'pending'
              ? 'border-flame/50 text-flame'
              : 'border-border text-muted-foreground',
          )}
        >
          {activity.status}
        </Badge>
      </div>
    </div>
  );
}

interface CashOutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceSol: number;
  fiatRate: number;
  currency: string;
}

function CashOutSheet({ open, onOpenChange, balanceSol, fiatRate, currency }: CashOutSheetProps) {
  const withdraw = useWithdraw();
  const [amountInput, setAmountInput] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('PIX');

  const amount = parseAmount(amountInput);
  const valid = amount > 0 && amount <= balanceSol;
  const receiveFiat = Math.max(amount * fiatRate * (1 - CASH_OUT_FEE_RATE), 0);

  const confirm = () => {
    if (!valid) return;
    withdraw.mutate(
      { amountSol: amount, method },
      {
        onSuccess: () => {
          toast.success('Cash out started — settling to your bank');
          setAmountInput('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="border-border bg-card rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">Cash out</SheetTitle>
          <SheetDescription>Convert SOL to {currency} and send it to your bank.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <label htmlFor="cash-out-amount" className="text-muted-foreground text-xs">
              Amount (SOL)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="cash-out-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className="h-12 font-mono text-lg"
              />
              <Button
                type="button"
                variant="outline"
                className="border-border h-12 shrink-0"
                onClick={() => setAmountInput(String(balanceSol))}
              >
                MAX
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px]">Available: {formatSol(balanceSol)}</p>
          </div>

          <div className="flex gap-2">
            {(['PIX', 'Bank transfer'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMethod(option)}
                className={cn(
                  'h-11 flex-1 rounded-lg border text-sm font-semibold transition-colors',
                  method === option
                    ? 'border-lime bg-lime/10 text-lime'
                    : 'border-border text-muted-foreground',
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="border-border bg-background rounded-xl border px-3 py-3">
            <p className="text-muted-foreground text-xs">You receive ≈</p>
            <p className="font-mono text-xl font-bold">{formatFiat(receiveFiat, currency)}</p>
            <p className="text-muted-foreground mt-1 text-[11px]">1.5% network + ramp fee</p>
          </div>
        </div>

        <SheetFooter>
          <Button
            size="lg"
            disabled={!valid || withdraw.isPending}
            onClick={confirm}
            className="bg-flame text-background hover:bg-flame/90 h-12 w-full disabled:opacity-40"
          >
            {withdraw.isPending ? 'Processing…' : 'Confirm cash out'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface AddFundsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiatRate: number;
  currency: string;
}

function AddFundsSheet({ open, onOpenChange, fiatRate, currency }: AddFundsSheetProps) {
  const deposit = useDeposit();
  const [amountInput, setAmountInput] = useState('');

  const amount = parseAmount(amountInput);
  const valid = amount > 0;
  const payFiat = amount * fiatRate;

  const confirm = () => {
    if (!valid) return;
    deposit.mutate(amount, {
      onSuccess: () => {
        toast.success('Funds added');
        setAmountInput('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="border-border bg-card rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">Add funds</SheetTitle>
          <SheetDescription>Buy SOL with {currency} to fund your calls.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <label htmlFor="add-funds-amount" className="text-muted-foreground text-xs">
              Amount (SOL)
            </label>
            <Input
              id="add-funds-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="h-12 font-mono text-lg"
            />
          </div>

          <div className="border-border bg-background rounded-xl border px-3 py-3">
            <p className="text-muted-foreground text-xs">You pay ≈</p>
            <p className="font-mono text-xl font-bold">{formatFiat(payFiat, currency)}</p>
          </div>
        </div>

        <SheetFooter>
          <Button
            size="lg"
            disabled={!valid || deposit.isPending}
            onClick={confirm}
            className="bg-lime text-background hover:bg-lime/90 h-12 w-full disabled:opacity-40"
          >
            {deposit.isPending ? 'Processing…' : 'Confirm add funds'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
