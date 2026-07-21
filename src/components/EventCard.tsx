import { Event } from '@/types/event';
import { Bookmark, Clock } from 'lucide-react';

interface EventCardProps {
  event: Event;
  distance?: string;
  duration?: string;
  onClick: () => void;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  className?: string;
}

const EventCard = ({ event, distance, onClick, isSaved, onToggleSaved, className }: EventCardProps) => {
  const categoryLabel = {
    coffee: '咖啡',
    music: '音乐',
    market: '市集',
    party: '派对',
    exhibition: '活动',
    bar: '酒吧',
    sports: '运动',
  }[event.category];
  const isTall = event.id === '2' || event.id === '5';

  return (
    <article
      className={[
        'group overflow-hidden rounded-3xl border border-border/80 bg-card text-left shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-float',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className={['relative overflow-hidden', isTall ? 'h-[220px]' : 'h-[170px]'].join(' ')}>
        <img 
          src={event.coverImage} 
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow-sm">
          {categoryLabel}
        </span>
        <button
          type="button"
          aria-label={isSaved ? '取消收藏' : '收藏'}
          onClick={(eventClick) => {
            eventClick.stopPropagation();
            onToggleSaved?.();
          }}
          className={[
            'absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-colors',
            isSaved ? 'bg-primary text-primary-foreground' : 'bg-foreground/45 text-white hover:bg-foreground/60',
          ].join(' ')}
        >
          <Bookmark className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-foreground">{event.title}</h3>
          <p className="line-clamp-2 text-[15px] font-semibold leading-relaxed text-muted-foreground">{event.description}</p>
        </div>
        
        <div className="space-y-2 text-sm font-semibold text-muted-foreground">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4" />
            <span>{event.dateLabel ?? event.date}, {event.time}</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="truncate">{event.location.district}</span>
            <strong className="shrink-0 text-base text-foreground">
              {event.ticket.isFree ? '免费' : `¥${event.ticket.price}`}
            </strong>
          </div>
          {distance && <div className="text-xs text-primary">距离 {distance}</div>}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {event.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-bold text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default EventCard;
