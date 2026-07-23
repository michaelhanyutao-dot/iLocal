import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Bookmark, CalendarClock, ChevronRight, LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, loading, signOut, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoggedIn = Boolean(user);
  const email = user?.email ?? '';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '未登录';
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
            {isLoggedIn ? initial : <UserRound className="h-9 w-9" />}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-foreground sm:text-[28px]">
              {loading ? '正在确认登录状态...' : displayName}
            </h1>
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground sm:text-base">
              {isLoggedIn ? email : '登录后同步收藏、计划和推荐'}
            </p>
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-base font-black text-foreground">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            {isLoggedIn ? '最近推荐' : '个性化推荐'}
          </div>
          <p className="text-base font-semibold text-muted-foreground">
            {isLoggedIn ? '还没有推荐记录。' : '登录后会根据你的收藏、喜欢和计划生成推荐。'}
          </p>
        </section>

        <section className="mt-7 space-y-4">
          {!isLoggedIn && !loading && (
            <ProfileRow
              icon={<LogIn className="h-5 w-5" />}
              label="登录 / 注册"
              onClick={() => navigate('/auth')}
              emphasized
            />
          )}
          <ProfileRow
            icon={<Bookmark className="h-5 w-5" />}
            label="收藏与到访"
            onClick={() => navigate('/saved')}
          />
          {isLoggedIn && (
            <ProfileRow
              icon={<ShieldCheck className="h-5 w-5" />}
              label={isAdmin || isModerator ? '运营后台' : '运营后台'}
              onClick={() => navigate('/dashboard')}
            />
          )}
        </section>

        {isLoggedIn && (
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
  emphasized,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  emphasized?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'flex h-16 w-full items-center justify-between rounded-2xl border px-5 text-left text-base font-black transition-colors',
      emphasized
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border/70 bg-card text-muted-foreground hover:bg-secondary/45',
    ].join(' ')}
  >
    <span className="flex items-center gap-4">
      {icon}
      {label}
    </span>
    <ChevronRight className="h-5 w-5" />
  </button>
);

export default Profile;
