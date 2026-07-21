import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { tagSchema, formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Tag as TagIcon,
  Palette
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const AdminTags = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  const colorPresets = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: "获取标签失败",
        description: "无法加载标签列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      color: '#3B82F6'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with Zod schema
    const validationResult = tagSchema.safeParse({
      name: formData.name,
      color: formData.color
    });
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
      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update({
            name: validatedData.name.trim(),
            color: validatedData.color
          })
          .eq('id', editingTag.id);

        if (error) throw error;
        
        toast({
          title: "标签更新成功",
          description: `标签 "${validatedData.name}" 已更新`,
        });
      } else {
        const { error } = await supabase
          .from('tags')
          .insert([{
            name: validatedData.name.trim(),
            color: validatedData.color
          }]);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast({
              title: "标签已存在",
              description: `标签 "${formData.name}" 已经存在`,
              variant: "destructive"
            });
            return;
          }
          throw error;
        }
        
        toast({
          title: "标签创建成功",
          description: `标签 "${formData.name}" 已创建`,
        });
      }

      setIsDialogOpen(false);
      fetchTags();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: "保存失败",
        description: "无法保存标签信息",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签 "${tag.name}" 吗？此操作不可恢复，所有使用此标签的活动都会失去此标签。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id);

      if (error) throw error;
      
      toast({
        title: "标签已删除",
        description: `标签 "${tag.name}" 已被删除`,
      });
      
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "删除失败",
        description: "无法删除该标签",
        variant: "destructive",
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
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回管理后台
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                标签管理
              </h1>
            </div>
            
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              新建标签
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总标签数</p>
                    <p className="text-3xl font-bold">{tags.length}</p>
                  </div>
                  <TagIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">颜色种类</p>
                    <p className="text-3xl font-bold">{new Set(tags.map(t => t.color)).size}</p>
                  </div>
                  <Palette className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">最新标签</p>
                    <p className="text-lg font-semibold truncate">
                      {tags.length > 0 ? tags[0].name : '暂无'}
                    </p>
                  </div>
                  <Badge 
                    style={{ backgroundColor: tags.length > 0 ? tags[0].color : '#6B7280' }}
                    className="text-white"
                  >
                    NEW
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags List */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                标签列表 ({tags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <div className="text-center py-8">
                  <TagIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">暂无标签</h3>
                  <p className="text-muted-foreground mb-4">创建您的第一个标签吧</p>
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建标签
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>标签名称</TableHead>
                        <TableHead>颜色</TableHead>
                        <TableHead>预览</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">{tag.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: tag.color }}
                              />
                              <code className="text-sm">{tag.color}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              style={{ 
                                backgroundColor: tag.color,
                                color: 'white'
                              }}
                            >
                              {tag.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(tag.created_at).toLocaleDateString('zh-CN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(tag)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(tag)}
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

          {/* Color Preview Grid */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                标签颜色分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag.id}
                    style={{ 
                      backgroundColor: tag.color,
                      color: 'white'
                    }}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleEdit(tag)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? '编辑标签' : '创建新标签'}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? '修改标签信息' : '设置标签名称和颜色'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">标签名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入标签名称"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="color">标签颜色</Label>
              <div className="space-y-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10"
                />
                
                <div className="grid grid-cols-5 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        formData.color === color 
                          ? 'border-primary scale-110' 
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">预览：</span>
              <Badge 
                style={{ 
                  backgroundColor: formData.color,
                  color: 'white'
                }}
              >
                {formData.name || '标签预览'}
              </Badge>
            </div>
          </form>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingTag ? '更新标签' : '创建标签'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTags;