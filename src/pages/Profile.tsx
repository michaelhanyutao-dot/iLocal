import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, LogOut, Calendar, Users, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockEvents } from '@/data/mockEvents';
import EventCard from '@/components/EventCard';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock user data
  const userCreatedEvents = mockEvents.slice(0, 2);
  const userAttendingEvents = mockEvents.slice(2, 4);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "已退出登录",
        description: "感谢使用活动发现！"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "退出失败",
        description: "请稍后再试",
        variant: "destructive"
      });
    }
  };

  const getUserInitials = (email: string) => {
    return email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U';
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
              onClick={() => navigate('/')}
              className="text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-6 mb-6 bg-gradient-card border-border/50">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24 mx-auto md:mx-0">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl">
                {getUserInitials(user?.email || '')}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {user?.email?.split('@')[0] || '用户'}
              </h1>
              <p className="text-muted-foreground mb-4">
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>创建了 {userCreatedEvents.length} 个活动</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>参与了 {userAttendingEvents.length} 个活动</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="md:self-start">
              <Edit className="w-4 h-4 mr-2" />
              编辑资料
            </Button>
          </div>
        </Card>

        {/* Activity Tabs */}
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="created">我创建的活动</TabsTrigger>
            <TabsTrigger value="attending">我参与的活动</TabsTrigger>
          </TabsList>

          {/* Created Events */}
          <TabsContent value="created">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  我创建的活动 ({userCreatedEvents.length})
                </h2>
                <Button onClick={() => navigate('/create-event')}>
                  创建新活动
                </Button>
              </div>
              
              {userCreatedEvents.length === 0 ? (
                <Card className="p-8 text-center bg-gradient-card border-border/50">
                  <div className="text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg mb-2">还没有创建过活动</p>
                    <p className="text-sm mb-4">创建你的第一个活动，与更多人分享精彩体验</p>
                    <Button onClick={() => navigate('/create-event')}>
                      创建活动
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCreatedEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard
                        event={event}
                        distance="1.2km"
                        duration="15分钟"
                        onClick={() => navigate(`/event/${event.id}`)}
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          管理
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Attending Events */}
          <TabsContent value="attending">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                我参与的活动 ({userAttendingEvents.length})
              </h2>
              
              {userAttendingEvents.length === 0 ? (
                <Card className="p-8 text-center bg-gradient-card border-border/50">
                  <div className="text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg mb-2">还没有参与过活动</p>
                    <p className="text-sm mb-4">去发现页面找找感兴趣的活动吧</p>
                    <Button onClick={() => navigate('/')}>
                      发现活动
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userAttendingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      distance="1.2km"
                      duration="15分钟"
                      onClick={() => navigate(`/event/${event.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;