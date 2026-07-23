import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  KeyRound,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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
type UserProfile = Tables<'app_user_profiles'>;
type AppRole = Database['public']['Enums']['app_role'];
type AccountStatus = 'active' | 'suspended';

const roleLabels: Record<AppRole, string> = {
  admin: '管理员',
  moderator: '编辑员',
  user: '普通用户',
};

const statusLabels: Record<AccountStatus, string> = {
  active: '活跃',
  suspended: '已禁用',
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AdminUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, accountStatus } = useAuth();
  const { toast } = useToast();
  const adminBase = getAdminBasePath(location.pathname);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profileNotes, setProfileNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<AppRole>('moderator');
  const [resetEmail, setResetEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('app_user_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const nextProfiles = profilesResult.data ?? [];
      setProfiles(nextProfiles);
      setRoles(rolesResult.data ?? []);
      setProfileNotes(
        Object.fromEntries(nextProfiles.map((profile) => [profile.user_id, profile.notes ?? ''])),
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: '无法加载用户管理数据',
        description:
          error instanceof Error
            ? error.message
            : '请确认已运行 app_user_profiles migration，且当前账号具有 admin 权限。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const rolesByUser = useMemo(() => {
    const map = new Map<string, UserRole[]>();
    roles.forEach((roleRow) => {
      const current = map.get(roleRow.user_id) ?? [];
      current.push(roleRow);
      map.set(roleRow.user_id, current);
    });
    return map;
  }, [roles]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) => {
      const userRoles = rolesByUser.get(profile.user_id)?.map((roleRow) => roleRow.role).join(' ') ?? '';
      return [
        profile.email,
        profile.display_name,
        profile.user_id,
        profile.status,
        userRoles,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [profiles, rolesByUser, searchQuery]);

  const activeUsers = profiles.filter((profile) => profile.status !== 'suspended').length;
  const suspendedUsers = profiles.filter((profile) => profile.status === 'suspended').length;

  const handleSelectProfile = (profile: UserProfile) => {
    setSelectedUserId(profile.user_id);
    setResetEmail(profile.email ?? '');
  };

  const handleAssignRole = async () => {
    const trimmedUserId = selectedUserId.trim();
    if (!uuidPattern.test(trimmedUserId)) {
      toast({
        title: 'user_id 格式不正确',
        description: '请选择用户，或粘贴 Supabase Auth 用户的 UUID。',
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
        title: '角色已更新',
        description: `${trimmedUserId} 已拥有 ${roleLabels[role]} 权限。`,
      });
      await fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: '角色分配失败',
        description: error instanceof Error ? error.message : '请检查权限或 user_id。',
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
      description: `${roleRow.user_id} 的 ${roleLabels[roleRow.role]} 权限已移除。`,
    });
    await fetchUsers();
  };

  const handleStatusChange = async (profile: UserProfile, nextStatus: AccountStatus) => {
    if (profile.user_id === user?.id && nextStatus === 'suspended') {
      toast({
        title: '不能禁用当前登录账号',
        description: '为了避免把自己锁在后台之外，请用另一个管理员账号操作。',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`确定将 ${profile.email ?? profile.user_id} 设为${statusLabels[nextStatus]}吗？`)) return;

    const { error } = await supabase
      .from('app_user_profiles')
      .update({
        status: nextStatus,
        status_updated_at: new Date().toISOString(),
        status_updated_by: user?.id ?? null,
      })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({
        title: '状态更新失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '账号状态已更新',
      description: `${profile.email ?? profile.user_id} 当前为${statusLabels[nextStatus]}。`,
    });
    await fetchUsers();
  };

  const handleSaveNotes = async (profile: UserProfile) => {
    const { error } = await supabase
      .from('app_user_profiles')
      .update({ notes: profileNotes[profile.user_id] ?? '' })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({
        title: '备注保存失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: '备注已保存' });
    await fetchUsers();
  };

  const handleSendPasswordReset = async (email = resetEmail) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: '请输入邮箱',
        description: '密码重置邮件需要发送到用户邮箱。',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: '重置邮件发送失败',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '已发送密码重置邮件',
      description: `用户可通过 ${trimmedEmail} 的邮件链接设置新密码。`,
    });
  };

  const currentProfile = profiles.find((profile) => profile.user_id === user?.id);

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
                <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
                <p className="text-sm text-muted-foreground">
                  账号台账、密码重置、权限分配和账户状态集中管理。
                </p>
              </div>
            </div>
            <Button onClick={fetchUsers} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto grid gap-6 px-4 py-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50 bg-gradient-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">全部账号</p>
                <p className="mt-1 text-2xl font-black">{profiles.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">活跃</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">{activeUsers}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-gradient-card">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">禁用</p>
                <p className="mt-1 text-2xl font-black text-destructive">{suspendedUsers}</p>
              </CardContent>
            </Card>
          </div>

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
              <p>
                状态：
                <Badge variant={accountStatus === 'suspended' ? 'destructive' : 'secondary'} className="ml-2 rounded-full">
                  {currentProfile?.status === 'suspended' ? '已禁用' : '活跃'}
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                权限分配
              </CardTitle>
              <CardDescription>
                从右侧选择用户，或粘贴 Supabase Auth 用户 UUID。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="selected_user_id">用户 user_id</Label>
                <Input
                  id="selected_user_id"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
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
                {saving ? '保存中...' : '分配 / 补充角色'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                一键密码重置
              </CardTitle>
              <CardDescription>
                系统不会查看或保存用户密码，只发送 Supabase 安全重置邮件。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset_email">用户邮箱</Label>
                <Input
                  id="reset_email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <Button onClick={() => handleSendPasswordReset()} disabled={!isAdmin} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                发送重置邮件
              </Button>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border/50 bg-gradient-card">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  用户列表 ({filteredProfiles.length})
                </CardTitle>
                <CardDescription>
                  管理账号状态、角色和运营备注。创建/删除 Auth 用户后续会放到服务端函数。
                </CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索邮箱、姓名、UUID、角色"
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isAdmin && (
              <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
                当前账号不是 admin。你可以查看被 RLS 允许的数据，但无法管理用户状态或权限。
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-muted-foreground">正在加载用户...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
                暂无用户记录。请先运行 app_user_profiles migration，或等待新用户登录后自动同步。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>账号</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>权限</TableHead>
                      <TableHead>登录 / 创建</TableHead>
                      <TableHead>运营备注</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => {
                      const userRoles = rolesByUser.get(profile.user_id) ?? [];
                      const status = profile.status === 'suspended' ? 'suspended' : 'active';

                      return (
                        <TableRow key={profile.user_id}>
                          <TableCell className="min-w-[260px]">
                            <div className="font-bold text-foreground">
                              {profile.display_name || profile.email?.split('@')[0] || '未命名用户'}
                            </div>
                            <div className="break-all text-sm font-semibold text-muted-foreground">
                              {profile.email ?? '未记录邮箱'}
                            </div>
                            <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                              {profile.user_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={status === 'suspended' ? 'destructive' : 'secondary'}
                              className="rounded-full"
                            >
                              {statusLabels[status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <div className="flex flex-wrap gap-2">
                              {userRoles.length === 0 ? (
                                <Badge variant="outline" className="rounded-full">无角色</Badge>
                              ) : (
                                userRoles.map((roleRow) => (
                                  <span key={roleRow.id} className="inline-flex items-center gap-1">
                                    <Badge
                                      variant={roleRow.role === 'admin' ? 'default' : 'secondary'}
                                      className="rounded-full"
                                    >
                                      {roleLabels[roleRow.role]}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteRole(roleRow)}
                                      disabled={!isAdmin}
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      aria-label={`移除${roleLabels[roleRow.role]}权限`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </span>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px] text-sm font-semibold text-muted-foreground">
                            <div>最后登录：{profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString('zh-CN') : '-'}</div>
                            <div>创建：{new Date(profile.created_at).toLocaleString('zh-CN')}</div>
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <Textarea
                              value={profileNotes[profile.user_id] ?? ''}
                              onChange={(event) =>
                                setProfileNotes((current) => ({
                                  ...current,
                                  [profile.user_id]: event.target.value,
                                }))
                              }
                              placeholder="记录用户来源、合作方、异常处理等"
                              className="min-h-20"
                              disabled={!isAdmin}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveNotes(profile)}
                              disabled={!isAdmin}
                              className="mt-2"
                            >
                              保存备注
                            </Button>
                          </TableCell>
                          <TableCell className="min-w-[220px] text-right">
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleSelectProfile(profile)}>
                                选中授权
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendPasswordReset(profile.email ?? '')}
                                disabled={!isAdmin || !profile.email}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                重置密码
                              </Button>
                              {status === 'suspended' ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleStatusChange(profile, 'active')}
                                  disabled={!isAdmin}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  启用账号
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(profile, 'suspended')}
                                  disabled={!isAdmin || profile.user_id === user?.id}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  禁用账号
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
