import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import { getAdminBasePath } from '@/lib/adminNavigation';
import { uploadEventCover } from '@/lib/eventCoverStorage';
import { eventFormSchema, formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description?: string;
  category: string;
  date: string;
  time: string;
  address: string;
  latitude: number;
  longitude: number;
  district?: string;
  is_free: boolean;
  price?: number;
  ticket_url?: string;
  cover_image?: string;
  organizer?: string;
  attendees: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const defaultEventFormData = {
  title: '',
  description: '',
  category: '',
  date: '',
  time: '',
  address: '',
  latitude: 0,
  longitude: 0,
  district: '',
  is_free: true,
  price: 0,
  ticket_url: '',
  cover_image: '',
  organizer: '',
  status: 'active' as 'active' | 'inactive' | 'draft'
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const adminBase = getAdminBasePath(location.pathname);
  const isCreateRoute = location.pathname.endsWith('/events/new');
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Event['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [coverUploading, setCoverUploading] = useState(false);
  const [formData, setFormData] = useState(defaultEventFormData);

  const categoryOptions = [
    { value: 'coffee', label: '咖啡活动', icon: '☕' },
    { value: 'music', label: '音乐演出', icon: '🎵' },
    { value: 'market', label: '创意市集', icon: '🛒' },
    { value: 'exhibition', label: '艺术展览', icon: '🎨' },
    { value: 'party', label: '聚会派对', icon: '🎉' },
    { value: 'bar', label: '酒吧活动', icon: '🍻' },
    { value: 'sports', label: '运动活动', icon: '🏃' },
  ];

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "获取活动失败",
        description: "无法加载活动列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchTags();
  }, [fetchEvents, fetchTags]);

  useEffect(() => {
    if (!isCreateRoute) return;
    setEditingEvent(null);
    setFormData(defaultEventFormData);
    setIsDialogOpen(true);
  }, [isCreateRoute]);

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData(defaultEventFormData);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open && isCreateRoute) {
      navigate(`${adminBase}/events`, { replace: true });
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      category: event.category,
      date: event.date,
      time: event.time,
      address: event.address,
      latitude: event.latitude,
      longitude: event.longitude,
      district: event.district || '',
      is_free: event.is_free,
      price: event.price || 0,
      ticket_url: event.ticket_url || '',
      cover_image: event.cover_image || '',
      organizer: event.organizer || '',
      status: event.status as 'active' | 'inactive' | 'draft'
    });
    setIsDialogOpen(true);
  };

  const handleCoverUpload = async (file?: File) => {
    if (!file) return;

    setCoverUploading(true);
    try {
      const publicUrl = await uploadEventCover(file, user?.id);
      setFormData((prev) => ({ ...prev, cover_image: publicUrl }));
      toast({
        title: '封面已上传',
        description: '图片 URL 已自动填入表单',
      });
    } catch (error) {
      console.error('Cover upload failed:', error);
      toast({
        title: '封面上传失败',
        description: error instanceof Error ? error.message : '请确认 Supabase Storage bucket 和权限已创建',
        variant: 'destructive',
      });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod schema
    const validationResult = eventFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessage = formatZodErrors(validationResult.error);
      toast({
        title: "表单验证失败",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    const validatedData = validationResult.data;

    try {
      type EventsInsert = Database['public']['Tables']['events']['Insert'];
      type EventsUpdate = Database['public']['Tables']['events']['Update'];

      const eventData = {
        ...validatedData,
        created_by: user?.id,
        attendees: editingEvent?.attendees || 0
      } as unknown as EventsInsert;

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData as EventsUpdate)
          .eq('id', editingEvent.id);

        if (error) throw error;
        
        toast({
          title: "活动更新成功",
          description: `"${formData.title}" 已更新`,
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
        
        toast({
          title: "活动创建成功",
          description: `"${formData.title}" 已创建`,
        });
      }

      setIsDialogOpen(false);
      if (isCreateRoute) {
        navigate(`${adminBase}/events`, { replace: true });
      }
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "保存失败",
        description: "无法保存活动信息",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`确定要删除活动 "${event.title}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      
      toast({
        title: "活动已删除",
        description: `"${event.title}" 已被删除`,
      });
      
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "删除失败",
        description: "无法删除该活动",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">停用</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">草稿</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? `${option.icon} ${option.label}` : category;
  };

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch = !normalizedSearch || [
        event.title,
        event.description,
        event.address,
        event.district,
        event.organizer,
      ].some((value) => (value ?? '').toLowerCase().includes(normalizedSearch));
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, events, searchQuery, statusFilter]);

  const eventStats = useMemo(() => {
    return events.reduce(
      (accumulator, event) => {
        accumulator.total += 1;
        if (event.status === 'active') accumulator.active += 1;
        if (event.status === 'draft') accumulator.draft += 1;
        if (event.status === 'inactive') accumulator.inactive += 1;
        return accumulator;
      },
      { total: 0, active: 0, draft: 0, inactive: 0 },
    );
  }, [events]);

  const handleStatusChange = async (event: Event, status: 'active' | 'inactive' | 'draft') => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: status === 'active' ? '活动已上架' : status === 'inactive' ? '活动已下架' : '活动已设为草稿',
        description: `"${event.title}" 状态已更新`,
      });
      fetchEvents();
    } catch (error) {
      console.error('Error changing event status:', error);
      toast({
        title: '状态更新失败',
        description: error instanceof Error ? error.message : '无法更新活动状态',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(adminBase)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回管理后台
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                活动管理
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`${adminBase}/import`)}>
                批量导入
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                新建活动
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              活动列表 ({filteredEvents.length}/{events.length})
            </CardTitle>
            <CardDescription>
              上架 {eventStats.active} · 草稿 {eventStats.draft} · 下架 {eventStats.inactive}
            </CardDescription>
            <div className="grid gap-3 pt-3 md:grid-cols-[minmax(220px,1fr)_180px_200px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索标题、地址、主办方..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | Event['status']) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">上架</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="inactive">下架</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                重置
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">暂无活动</h3>
                <p className="text-muted-foreground mb-4">创建您的第一个活动吧</p>
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  创建活动
                </Button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">没有匹配活动</h3>
                <p className="text-muted-foreground mb-4">调整搜索词或筛选条件后再试</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  清除筛选
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>封面</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>类别</TableHead>
                      <TableHead>日期时间</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>参与人数</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="h-12 w-16 overflow-hidden rounded-lg bg-secondary">
                            {event.cover_image ? (
                              <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-lg">
                                {categoryOptions.find((category) => category.value === event.category)?.icon ?? '📍'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{getCategoryLabel(event.category)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event.date}
                            <Clock className="w-3 h-3 ml-2" />
                            {event.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.district || event.address.substring(0, 20)}...
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attendees}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {event.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(event, 'inactive')}
                              >
                                下架
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(event, 'active')}
                              >
                                上架
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(event)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(event)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? '编辑活动' : '创建新活动'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? '修改活动信息' : '填写活动详细信息'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">活动标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">活动描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>活动类别 *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">活动日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="time">开始时间 *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="address">详细地址 *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="latitude">纬度</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="longitude">经度</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="district">区域</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="organizer">主办方</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="cover_image">封面图片 URL</Label>
                <div className="mt-1 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <Input
                    id="cover_image"
                    value={formData.cover_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                    placeholder="https://..."
                  />
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                    <Upload className="mr-2 h-4 w-4" />
                    {coverUploading ? '上传中...' : '上传封面'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={coverUploading}
                      onChange={(event) => {
                        void handleCoverUpload(event.target.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                {formData.cover_image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-secondary">
                    <img src={formData.cover_image} alt="活动封面预览" className="h-36 w-full object-cover" />
                  </div>
                )}
              </div>
              
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
                />
                <Label htmlFor="is_free">免费活动</Label>
              </div>
              
              {!formData.is_free && (
                <>
                  <div>
                    <Label htmlFor="price">票价 (元)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket_url">购票链接</Label>
                    <Input
                      id="ticket_url"
                      value={formData.ticket_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, ticket_url: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
          </form>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingEvent ? '更新活动' : '创建活动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
