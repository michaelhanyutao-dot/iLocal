import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Plus, Shield, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminBasePath } from '@/lib/adminNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

type UserRole = Tables<'user_roles'>;
type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  admin: '管理员',
  moderator: '编辑员',
  user: '普通用户',
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AdminUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const adminBase = getAdminBasePath(location.pathname);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<AppRole>('moderator');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data ?? []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: '无法加载角色列表',
        description: error instanceof Error ? error.message : '请确认当前账号具有 admin 权限',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAssignRole = async () => {
    const trimmedUserId = userId.trim();
    if (!uuidPattern.test(trimmedUserId)) {
      toast({
        title: 'user_id 格式不正确',
        description: '请粘贴 Supabase Auth 用户的 UUID',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: trimmedUserId, role }, { onConflict: 'user_id,role' });

      if (error) throw error;

      toast({
        title: '角色已分配',
        description: `${trimmedUserId} 已拥有 ${roleLabels[role]} 权限`,
      });
      setUserId('');
      await fetchRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: '角色分配失败',
        description: error instanceof Error ? error.message : '请检查权限或 user_id',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleRow: UserRole) => {
    if (!confirm(`确定移除 ${roleLabels[roleRow.role]} 权限吗？`)) return;

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleRow.id);

    if (error) {
      toast({
        title: '移除失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '角色已移除',
      description: `${roleRow.user_id} 的 ${roleLabels[roleRow.role]} 权限已移除`,
    });
    await fetchRoles();
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(adminBase)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回管理后台
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">用户角色管理</h1>
                <p className="text-sm text-muted-foreground">给运营账号分配 admin 或 moderator 权限</p>
              </div>
            </div>
            <Button onClick={fetchRoles} variant="outline" disabled={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="space-y-6">
          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                分配角色
              </CardTitle>
              <CardDescription>
                从 Supabase Authentication 的 Users 页面复制用户 UUID，再粘贴到这里。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Supabase user_id</Label>
                <Input
                  id="user_id"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select value={role} onValueChange={(value: AppRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">编辑员 moderator</SelectItem>
                    <SelectItem value="admin">管理员 admin</SelectItem>
                    <SelectItem value="user">普通用户 user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignRole} disabled={saving || !isAdmin} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {saving ? '保存中...' : '分配角色'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-5 w-5" />
                当前登录账号
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-semibold text-muted-foreground">
              <p className="break-all">邮箱：{user?.email ?? '-'}</p>
              <p className="break-all">user_id：{user?.id ?? '-'}</p>
              <p>
                权限：
                <Badge className="ml-2 rounded-full">
                  {isAdmin ? 'admin' : 'non-admin'}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border/50 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              角色列表 ({roles.length})
            </CardTitle>
            <CardDescription>
              RLS 会限制非管理员只能看到自己的角色；只有 admin 可以分配和移除角色。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAdmin && (
              <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
                当前账号不是 admin。你可以查看自己的角色，但无法分配或移除其他用户权限。
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-muted-foreground">正在加载角色...</div>
            ) : roles.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-muted-foreground">暂无角色记录</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>user_id</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((roleRow) => (
                      <TableRow key={roleRow.id}>
                        <TableCell className="max-w-[340px] break-all font-mono text-xs">{roleRow.user_id}</TableCell>
                        <TableCell>
                          <Badge variant={roleRow.role === 'admin' ? 'default' : 'secondary'} className="rounded-full">
                            {roleLabels[roleRow.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(roleRow.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(roleRow)}
                            disabled={!isAdmin}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminUsers;
