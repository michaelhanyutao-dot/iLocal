import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import type { LocationAccuracy } from '@/types/event';
import { getAdminBasePath } from '@/lib/adminNavigation';
import { uploadEventCover } from '@/lib/eventCoverStorage';
import { eventFormSchema, formatZodErrors, sourcePlatforms, type SourcePlatform } from '@/lib/validation';
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
  location_accuracy?: string;
  location_note?: string;
  location_verified_at?: string | null;
  location_verified_by?: string | null;
  district?: string;
  is_free: boolean;
  price?: number;
  ticket_url?: string;
  cover_image?: string;
  cover_source_url?: string;
  organizer?: string;
  source_platform?: string;
  source_url?: string;
  source_title?: string;
  source_notes?: string;
  source_checked_at?: string | null;
  source_checked_by?: string | null;
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
  location_accuracy: 'unverified' as LocationAccuracy,
  location_note: '',
  district: '',
  is_free: true,
  price: 0,
  ticket_url: '',
  cover_image: '',
  cover_source_url: '',
  organizer: '',
  source_platform: 'manual' as SourcePlatform,
  source_url: '',
  source_title: '',
  source_notes: '',
  source_checked: false,
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
  const [locationFilter, setLocationFilter] = useState<'all' | LocationAccuracy>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | SourcePlatform>('all');
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

  const locationAccuracyOptions: Array<{
    value: LocationAccuracy;
    label: string;
    description: string;
  }> = [
    {
      value: 'precise',
      label: '精确位置',
      description: '已确认到店名、场馆或门牌，可直接导航',
    },
    {
      value: 'area',
      label: '区域估算',
      description: '只有园区、商圈、公园或集合区域，需要用户出发前核对',
    },
    {
      value: 'unverified',
      label: '待核验',
      description: '来自采集线索，地址和坐标尚未二次确认',
    },
  ];

  const sourcePlatformOptions: Array<{
    value: SourcePlatform;
    label: string;
  }> = [
    { value: 'manual', label: '手动录入' },
    { value: 'xiaohongshu', label: '小红书' },
    { value: 'wechat', label: '微信/公众号' },
    { value: 'website', label: '官网/网页' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'partner_api', label: '合作方 API' },
    { value: 'csv', label: 'CSV 批量' },
    { value: 'other', label: '其他来源' },
  ];

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data || []).map((event) => ({
        ...event,
        location_accuracy: normalizeLocationAccuracy(event.location_accuracy),
      })));
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
      location_accuracy: normalizeLocationAccuracy(event.location_accuracy),
      location_note: event.location_note || '',
      district: event.district || '',
      is_free: event.is_free,
      price: event.price || 0,
      ticket_url: event.ticket_url || '',
      cover_image: event.cover_image || '',
      cover_source_url: event.cover_source_url || '',
      organizer: event.organizer || '',
      source_platform: normalizeSourcePlatform(event.source_platform),
      source_url: event.source_url || '',
      source_title: event.source_title || '',
      source_notes: event.source_notes || '',
      source_checked: Boolean(event.source_checked_at),
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
    const nextLocationAccuracy = formData.location_accuracy;
    const nextLocationVerifiedAt = nextLocationAccuracy === 'precise'
      ? editingEvent?.location_verified_at || new Date().toISOString()
      : null;
    const nextSourceCheckedAt = formData.source_checked
      ? editingEvent?.source_checked_at || new Date().toISOString()
      : null;

    try {
      type EventsInsert = Database['public']['Tables']['events']['Insert'];
      type EventsUpdate = Database['public']['Tables']['events']['Update'];

      const eventData = {
        ...validatedData,
        created_by: user?.id,
        attendees: editingEvent?.attendees || 0,
        location_accuracy: nextLocationAccuracy,
        location_note: formData.location_note.trim() || null,
        location_verified_at: nextLocationVerifiedAt,
        location_verified_by: nextLocationAccuracy === 'precise' ? user?.id ?? null : null,
        source_platform: formData.source_platform,
        source_url: formData.source_url.trim() || null,
        source_title: formData.source_title.trim() || null,
        source_notes: formData.source_notes.trim() || null,
        cover_source_url: formData.cover_source_url.trim() || null,
        source_checked_at: nextSourceCheckedAt,
        source_checked_by: formData.source_checked ? user?.id ?? null : null,
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

  const getLocationAccuracyBadge = (accuracy?: string) => {
    switch (accuracy) {
      case 'precise':
        return <Badge className="bg-primary/15 text-primary hover:bg-primary/15">精确</Badge>;
      case 'area':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">区域估算</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">待核验</Badge>;
    }
  };

  const getSourcePlatformLabel = (platform?: string) =>
    sourcePlatformOptions.find((option) => option.value === platform)?.label ?? '手动录入';

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch = !normalizedSearch || [
        event.title,
        event.description,
        event.address,
        event.district,
        event.organizer,
        event.source_title,
        event.source_url,
        event.source_notes,
      ].some((value) => (value ?? '').toLowerCase().includes(normalizedSearch));
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      const matchesLocation = locationFilter === 'all' || event.location_accuracy === locationFilter;
      const matchesSource = sourceFilter === 'all' || event.source_platform === sourceFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesSource;
    });
  }, [categoryFilter, events, locationFilter, searchQuery, sourceFilter, statusFilter]);

  const eventStats = useMemo(() => {
    return events.reduce(
      (accumulator, event) => {
        accumulator.total += 1;
        if (event.status === 'active') accumulator.active += 1;
        if (event.status === 'draft') accumulator.draft += 1;
        if (event.status === 'inactive') accumulator.inactive += 1;
        if (event.location_accuracy !== 'precise') accumulator.needsLocationReview += 1;
        if (event.source_url && !event.source_checked_at) accumulator.needsSourceReview += 1;
        return accumulator;
      },
      { total: 0, active: 0, draft: 0, inactive: 0, needsLocationReview: 0, needsSourceReview: 0 },
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
              上架 {eventStats.active} · 草稿 {eventStats.draft} · 下架 {eventStats.inactive} · 待位置核验 {eventStats.needsLocationReview} · 待来源核验 {eventStats.needsSourceReview}
            </CardDescription>
            <div className="grid gap-3 pt-3 md:grid-cols-[minmax(220px,1fr)_150px_170px_170px_170px_auto]">
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
              <Select value={locationFilter} onValueChange={(value: 'all' | LocationAccuracy) => setLocationFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="位置核验" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部位置</SelectItem>
                  <SelectItem value="precise">精确位置</SelectItem>
                  <SelectItem value="area">区域估算</SelectItem>
                  <SelectItem value="unverified">待核验</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(value: 'all' | SourcePlatform) => setSourceFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  {sourcePlatformOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  setLocationFilter('all');
                  setSourceFilter('all');
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
                    setLocationFilter('all');
                    setSourceFilter('all');
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
                      <TableHead>位置</TableHead>
                      <TableHead>来源</TableHead>
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
                          <div className="flex max-w-[220px] items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{event.district || event.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getLocationAccuracyBadge(event.location_accuracy)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={event.source_url ? 'secondary' : 'outline'} className="w-fit">
                              {getSourcePlatformLabel(event.source_platform)}
                            </Badge>
                            {event.source_url && !event.source_checked_at && (
                              <span className="text-xs font-semibold text-amber-700">待核验</span>
                            )}
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
                <Label>位置可信度</Label>
                <Select
                  value={formData.location_accuracy}
                  onValueChange={(value: LocationAccuracy) => setFormData(prev => ({ ...prev, location_accuracy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationAccuracyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {locationAccuracyOptions.find((option) => option.value === formData.location_accuracy)?.description}
                </p>
              </div>
              
              <div>
                <Label htmlFor="district">区域</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="location_note">位置备注</Label>
                <Textarea
                  id="location_note"
                  value={formData.location_note}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_note: e.target.value }))}
                  rows={2}
                  placeholder="例如：只有园区信息，建议用户查看来源或搜索主办方最新集合点"
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

              <div className="col-span-2 rounded-xl border border-border/70 bg-secondary/25 p-4">
                <div className="mb-3">
                  <h3 className="text-base font-black text-foreground">来源与核验</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    记录活动线索从哪里来，方便后续复查、更新和确认宣传图来源。
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>来源平台</Label>
                    <Select
                      value={formData.source_platform}
                      onValueChange={(value: SourcePlatform) => setFormData(prev => ({ ...prev, source_platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourcePlatformOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source_title">来源标题</Label>
                    <Input
                      id="source_title"
                      value={formData.source_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_title: e.target.value }))}
                      placeholder="例如：小红书原帖标题"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="source_url">来源链接</Label>
                    <Input
                      id="source_url"
                      value={formData.source_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cover_source_url">封面图来源链接</Label>
                    <Input
                      id="cover_source_url"
                      value={formData.cover_source_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_source_url: e.target.value }))}
                      placeholder="封面图对应的小红书、官网或主办方页面"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="source_notes">来源核验备注</Label>
                    <Textarea
                      id="source_notes"
                      value={formData.source_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_notes: e.target.value }))}
                      rows={2}
                      placeholder="例如：已核对原帖日期，但集合点仍需活动当天确认"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <Switch
                      id="source_checked"
                      checked={formData.source_checked}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, source_checked: checked }))}
                    />
                    <Label htmlFor="source_checked">来源已核验</Label>
                  </div>
                </div>
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

const normalizeLocationAccuracy = (value?: string | null): LocationAccuracy => {
  if (value === 'precise' || value === 'area' || value === 'unverified') return value;
  return 'unverified';
};

const normalizeSourcePlatform = (value?: string | null): SourcePlatform => {
  return sourcePlatforms.includes(value as SourcePlatform) ? (value as SourcePlatform) : 'manual';
};

export default AdminEvents;
