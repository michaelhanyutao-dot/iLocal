import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CalendarClock, ChevronRight, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = user?.email ?? 'michaelhan6666@gmail.com';
  const displayName = user?.email?.split('@')[0] || 'Michael Han';
  const initial = displayName.slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: '已退出登录' });
      navigate('/');
    } catch {
      toast({
        title: '退出失败',
        description: '请稍后再试',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppShell>
      <main className="ilocal-page ilocal-page-padding min-h-screen pb-8 pt-8 sm:pt-10">
        <section className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-foreground text-3xl font-black text-background sm:h-[88px] sm:w-[88px]">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-foreground sm:text-[28px]">{displayName}</h1>
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground sm:text-base">{email}</p>
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-base font-black text-foreground">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            最近推荐
          </div>
          <p className="text-base font-semibold text-muted-foreground">还没有推荐记录。</p>
        </section>

        <section className="mt-7 space-y-4">
          <ProfileRow
            icon={<Settings className="h-5 w-5" />}
            label="收藏与到访"
            onClick={() => navigate('/saved')}
          />
          {(isAdmin || isModerator) && (
            <ProfileRow
              icon={<ShieldCheck className="h-5 w-5" />}
              label="活动后台"
              onClick={() => navigate('/admin')}
            />
          )}
          {!user && (
            <ProfileRow
              icon={<UserRound className="h-5 w-5" />}
              label="登录 / 注册"
              onClick={() => navigate('/auth')}
            />
          )}
        </section>

        {user && (
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="mt-8 h-14 w-full rounded-2xl text-base font-black text-muted-foreground"
          >
            <LogOut className="mr-2 h-5 w-5" />
            退出登录
          </Button>
        )}
      </main>
    </AppShell>
  );
};

const ProfileRow = ({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-16 w-full items-center justify-between rounded-2xl border border-border/70 bg-card px-5 text-left text-base font-black text-muted-foreground"
  >
    <span className="flex items-center gap-4">
      {icon}
      {label}
    </span>
    <ChevronRight className="h-5 w-5" />
  </button>
);

export default Profile;
