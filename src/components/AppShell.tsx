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
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/95 backdrop-blur-xl">
        <div className="ilocal-bottom-inner grid h-[68px] grid-cols-3 px-6 sm:h-[70px] sm:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors sm:text-[13px]',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'grid h-7 w-7 place-items-center rounded-lg border transition-colors sm:h-[30px] sm:w-[30px] sm:rounded-xl',
                        isActive ? 'border-primary/40 bg-primary/10' : 'border-transparent',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.4} />
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
