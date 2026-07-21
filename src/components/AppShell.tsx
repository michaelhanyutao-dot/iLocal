import { Compass, Heart, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', label: '发现', icon: Compass },
  { to: '/saved', label: '收藏', icon: Heart },
  { to: '/me', label: '我的', icon: UserRound },
];

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[74px] w-full max-w-[390px] grid-cols-3 px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center gap-1 text-[13px] font-semibold transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'grid h-8 w-8 place-items-center rounded-xl border transition-colors',
                        isActive ? 'border-primary/40 bg-primary/10' : 'border-transparent',
                      ].join(' ')}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.4} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
