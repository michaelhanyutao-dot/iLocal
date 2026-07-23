import { EventCategory } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterBarProps {
  selectedCategories: EventCategory[];
  onCategoryToggle: (category: EventCategory) => void;
  onClearCategories?: () => void;
  includeAll?: boolean;
}

const FilterBar = ({ 
  selectedCategories, 
  onCategoryToggle,
  onClearCategories,
  includeAll = true,
}: FilterBarProps) => {
  const { t } = useLanguage();
  
  const categories = [
    { key: 'all' as const, label: '全部', icon: '🧭' },
    { key: 'coffee' as EventCategory, label: t('category.coffee'), icon: '☕' },
    { key: 'music' as EventCategory, label: t('category.music'), icon: '🎵' },
    { key: 'market' as EventCategory, label: t('category.market'), icon: '🛍️' },
    { key: 'party' as EventCategory, label: t('category.party'), icon: '🥂' },
    { key: 'exhibition' as EventCategory, label: t('category.exhibition'), icon: '🖼️' },
    { key: 'bar' as EventCategory, label: t('category.bar'), icon: '🎧' },
    { key: 'sports' as EventCategory, label: t('category.sports'), icon: '🏃' },
  ];

  const selectedColors: Record<EventCategory, string> = {
    coffee: 'border-coffee/50 bg-coffee text-white',
    music: 'border-music/50 bg-music text-white',
    market: 'border-market/50 bg-market text-white',
    party: 'border-party/50 bg-party text-white',
    exhibition: 'border-exhibition/50 bg-exhibition text-white',
    bar: 'border-bar/50 bg-bar text-white',
    sports: 'border-sports/50 bg-sports text-white',
  };

  const visibleCategories = includeAll ? categories : categories.filter((category) => category.key !== 'all');

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max gap-3 pb-1">
        {visibleCategories.map((category) => {
          const isAll = category.key === 'all';
          const isSelected = isAll ? selectedCategories.length === 0 : selectedCategories.includes(category.key as EventCategory);
          return (
            <button
              key={category.key}
              type="button"
              className={[
                'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold shadow-sm transition-colors sm:h-[60px] sm:w-[60px]',
                isSelected
                  ? isAll
                    ? 'border-primary/50 bg-primary text-primary-foreground'
                    : selectedColors[category.key as EventCategory]
                  : 'border-border/50 bg-card/80 text-muted-foreground hover:bg-muted/50',
              ].join(' ')}
              onClick={() => {
                if (isAll) {
                  onClearCategories?.();
                  return;
                }
                onCategoryToggle(category.key as EventCategory);
              }}
            >
              <span className="text-[21px] leading-none sm:text-[22px]">{category.icon}</span>
              <span className="leading-none">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
