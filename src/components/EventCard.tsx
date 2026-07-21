import { Event } from '@/types/event';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Ticket } from 'lucide-react';

interface EventCardProps {
  event: Event;
  distance?: string;
  duration?: string;
  onClick: () => void;
}

const EventCard = ({ event, distance, duration, onClick }: EventCardProps) => {
  const getCategoryIcon = (category: string) => {
    const icons = {
      music: '🎵',
      market: '🛍️',
      party: '🥂',
      exhibition: '🖼️',
      bar: '🎧'
    };
    return icons[category as keyof typeof icons] || '📍';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      music: 'bg-music/20 text-music border-music/30',
      market: 'bg-market/20 text-market border-market/30',
      party: 'bg-party/20 text-party border-party/30',
      exhibition: 'bg-exhibition/20 text-exhibition border-exhibition/30',
      bar: 'bg-bar/20 text-bar border-bar/30'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-smooth hover:shadow-float hover:-translate-y-1 bg-gradient-card border-border/50"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.coverImage} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className={getCategoryColor(event.category)}>
            <span className="mr-1">{getCategoryIcon(event.category)}</span>
            {event.category}
          </Badge>
        </div>
        {!event.ticket.isFree && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              <Ticket className="w-3 h-3 mr-1" />
              ¥{event.ticket.price}
            </Badge>
          </div>
        )}
        {event.ticket.isFree && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              免费
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {event.title}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {event.description}
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{event.date} {event.time}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.location.address}</span>
          </div>
          
          {(distance || duration) && (
            <div className="flex items-center gap-4 text-xs">
              {distance && <span className="text-primary">距离 {distance}</span>}
              {duration && <span className="text-primary">步行 {duration}</span>}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{event.attendees} 人感兴趣</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {event.organizer}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 pt-2">
          {event.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs border-muted bg-muted/30"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;