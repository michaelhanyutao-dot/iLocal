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
    { key: 'bar' as EventCategory, label: t('category.bar'), icon: '🍷' },
    { key: 'music' as EventCategory, label: t('category.music'), icon: '🎵' },
    { key: 'exhibition' as EventCategory, label: t('category.exhibition'), icon: '🖼️' },
    { key: 'market' as EventCategory, label: t('category.market'), icon: '🛍️' },
    { key: 'party' as EventCategory, label: t('category.party'), icon: '🥂' },
    { key: 'sports' as EventCategory, label: t('category.sports'), icon: '🏃' },
  ];

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
                'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition-colors sm:h-[60px] sm:w-[60px]',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-transparent bg-secondary/55 text-muted-foreground hover:bg-secondary',
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
