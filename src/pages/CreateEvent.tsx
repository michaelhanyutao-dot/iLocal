import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, EventCategory } from '@/types/event';
import { publicEventSchema, formatZodErrors } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, MapPin, Calendar, Clock, Tag, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as EventCategory | '',
    date: '',
    time: '',
    address: '',
    district: '',
    isFree: true,
    price: 0,
    ticketUrl: '',
    organizer: '',
    tags: '',
    coverImageFile: null as File | null,
  });

  const categoryOptions: { value: EventCategory; label: string; icon: string }[] = [
    { value: 'music', label: '音乐演出', icon: '🎵' },
    { value: 'market', label: '创意市集', icon: '🛒' },
    { value: 'exhibition', label: '艺术展览', icon: '🎨' },
    { value: 'party', label: '聚会派对', icon: '🎉' },
    { value: 'bar', label: '酒吧活动', icon: '🍻' },
  ];

  const handleInputChange = (field: string, value: string | number | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverImageFile: file }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form data with Zod schema
    const validationResult = publicEventSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessage = formatZodErrors(validationResult.error);
      toast({
        title: "表单验证失败",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    // Here you would typically submit to your backend/database
    toast({
      title: "活动发布成功！",
      description: `"${formData.title}" 已成功发布`,
    });
    
    // Navigate back to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            发布新活动
          </h1>
          <p className="text-muted-foreground mt-2">
            分享您的精彩活动，让更多人参与其中
          </p>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              活动信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    活动标题 *
                  </Label>
                  <Input
                    id="title"
                    placeholder="输入活动标题"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">活动描述</Label>
                  <Textarea
                    id="description"
                    placeholder="详细描述您的活动内容、亮点等"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>活动类别 *</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择活动类别" />
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
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    活动日期 *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    开始时间 *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    详细地址 *
                  </Label>
                  <Input
                    id="address"
                    placeholder="具体地址，如：北京市朝阳区工体北路8号"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="district">所属区域</Label>
                  <Input
                    id="district"
                    placeholder="如：朝阳区"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Tickets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="free-event">免费活动</Label>
                  <Switch
                    id="free-event"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => handleInputChange('isFree', checked)}
                  />
                </div>
                
                {!formData.isFree && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">票价 (元)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', Number(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-url">购票链接</Label>
                      <Input
                        id="ticket-url"
                        placeholder="购票网址"
                        value={formData.ticketUrl}
                        onChange={(e) => handleInputChange('ticketUrl', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organizer" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    主办方
                  </Label>
                  <Input
                    id="organizer"
                    placeholder="主办方名称"
                    value={formData.organizer}
                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">活动标签</Label>
                  <Input
                    id="tags"
                    placeholder="用逗号分隔，如：音乐,现场,三里屯"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="cover-image">活动封面图片</Label>
                  <Input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-2"
                  />
                  {formData.coverImageFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      已选择: {formData.coverImageFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6">
                <Button type="submit" className="w-full" size="lg">
                  发布活动
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
