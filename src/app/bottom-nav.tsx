import { NavLink } from 'react-router-dom';
import { History, House, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const TABS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

export function BottomNav() {
  return (
    <nav className="border-border bg-card/95 sticky bottom-0 z-20 flex shrink-0 items-center justify-around border-t px-2 py-2 backdrop-blur">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-lime' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className={cn('size-5', isActive && 'drop-shadow-[0_0_6px_var(--lime)]')} />
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
