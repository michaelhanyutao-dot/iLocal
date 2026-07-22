import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Tag, 
  Users, 
  BarChart3, 
  Plus, 
  LogOut,
  ArrowLeft,
  Settings,
  Eye,
  Edit,
  FileSpreadsheet,
  ClipboardList,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user, signOut, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTags: 0,
    totalUsers: 0,
    pendingCandidates: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      // Fetch events count
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact' });

      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch tags count
      const { count: totalTags } = await supabase
        .from('tags')
        .select('*', { count: 'exact' });

      // Fetch users count (only admins can see this)
      let totalUsers = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact' });
        totalUsers = count || 0;
      }

      let pendingCandidates = 0;
      const { count: candidateCount, error: candidateCountError } = await supabase
        .from('event_import_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!candidateCountError) {
        pendingCandidates = candidateCount || 0;
      }

      setStats({
        totalEvents: totalEvents || 0,
        activeEvents: activeEvents || 0,
        totalTags: totalTags || 0,
        totalUsers,
        pendingCandidates: pendingCandidates || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "已退出登录",
      description: "感谢您的使用！",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  后台管理
                </h1>
                <p className="text-sm text-muted-foreground">
                  欢迎, {user?.email}
                  <Badge variant="secondary" className="ml-2">
                    {isAdmin ? '管理员' : isModerator ? '编辑员' : '用户'}
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/events')}
              >
                <Eye className="w-4 h-4 mr-2" />
                管理活动
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总活动数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                活跃活动: {stats.activeEvents}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">标签数量</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
              <p className="text-xs text-muted-foreground">
                可用标签
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">注册用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? '总用户数' : '需要管理员权限查看'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">系统状态</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">正常</div>
              <p className="text-xs text-muted-foreground">
                系统运行正常
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核线索</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCandidates}</div>
              <p className="text-xs text-muted-foreground">
                采集候选池
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/events')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                活动管理
              </CardTitle>
              <CardDescription>
                查看、编辑、删除和创建新活动
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                管理活动
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/intake')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                采集候选池
              </CardTitle>
              <CardDescription>
                审核从小红书、网页或人工整理来的活动线索
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <ClipboardList className="w-4 h-4 mr-2" />
                审核线索
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/import')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                批量导入
              </CardTitle>
              <CardDescription>
                从 CSV 批量写入活动，适合早期快速铺内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                导入活动
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/tags')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                标签管理
              </CardTitle>
              <CardDescription>
                管理活动标签和分类系统
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                管理标签
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  用户管理
                </CardTitle>
                <CardDescription>
                  管理用户权限和角色分配
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="secondary">
                  <Users className="w-4 h-4 mr-2" />
                  管理用户
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/events/new')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                创建活动
              </CardTitle>
              <CardDescription>
                快速创建新的活动信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                <Plus className="w-4 h-4 mr-2" />
                新建活动
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
