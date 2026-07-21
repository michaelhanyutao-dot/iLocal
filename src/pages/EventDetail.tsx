import { useParams, useNavigate } from 'react-router-dom';
import { mockEvents } from '@/data/mockEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Clock, Calendar, Users, Share, Heart, MessageCircle, Lock } from 'lucide-react';
import EventMap from '@/components/EventMap';
import { useToast } from '@/hooks/use-toast';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">活动不存在</h1>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  // Check if user is logged in to view details
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
            </div>
          </div>
        </div>

        {/* Login Required */}
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
            />
          </div>
          
          <Card className="p-8 text-center bg-gradient-card border-border/50">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
            <p className="text-muted-foreground mb-6">{t('login.required')}</p>
            <Button onClick={() => navigate('/login')} className="px-8">
              {t('login.button')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      toast({ title: "分享链接已复制到剪贴板" });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      music: 'bg-music text-white',
      market: 'bg-market text-white',
      party: 'bg-party text-white',
      exhibition: 'bg-exhibition text-white',
      bar: 'bg-bar text-white',
      sports: 'bg-primary text-white'
    };
    return colors[category as keyof typeof colors] || 'bg-primary text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" 
                size="sm"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Event Image */}
        <div className="mb-6">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <div className="mb-4">
                <Badge className={getCategoryColor(event.category)}>
                  {event.category === 'music' && '🎵 音乐'}
                  {event.category === 'market' && '🛍️ 市集'}
                  {event.category === 'party' && '🥂 派对'}
                  {event.category === 'exhibition' && '🖼️ 展览'}
                  {event.category === 'bar' && '🎧 酒吧'}
                  {event.category === 'sports' && '🏃‍♂️ 运动'}
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {event.title}
              </h1>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {event.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{event.attendees} {t('event.attendees')}</span>
                </div>
              </div>
            </Card>

            {/* Location & Map */}
            <Card className="p-0 overflow-hidden bg-gradient-card border-border/50">
              <div className="p-6 border-b border-border/50">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  活动地点
                </h3>
                <p className="text-foreground font-medium">{event.location.address}</p>
                <p className="text-sm text-muted-foreground">{event.location.district}</p>
              </div>
              <div className="h-64">
                <EventMap
                  events={[event]}
                  userLocation={null}
                  selectedEvent={event}
                  onEventSelect={() => {}}
                />
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">相关标签</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket Info */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">票价信息</h3>
              {event.ticket.isFree ? (
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary mb-2">免费</p>
                  <Button className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    参加活动
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary mb-2">
                    ¥{event.ticket.price}
                  </p>
                  <Button className="w-full">
                    购买门票
                  </Button>
                </div>
              )}
            </Card>

            {/* Organizer */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">主办方</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{event.organizer[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.organizer}</p>
                  <p className="text-sm text-muted-foreground">活动组织者</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                联系主办方
              </Button>
            </Card>

            {/* Attendees */}
            <Card className="p-6 bg-gradient-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">参与者 ({event.attendees})</h3>
              <div className="flex -space-x-2 mb-4">
                {[...Array(Math.min(5, event.attendees))].map((_, i) => (
                  <Avatar key={i} className="border-2 border-background">
                    <AvatarFallback>U{i + 1}</AvatarFallback>
                  </Avatar>
                ))}
                {event.attendees > 5 && (
                  <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{event.attendees - 5}
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full">
                查看所有参与者
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
