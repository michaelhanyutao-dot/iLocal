import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventCategory } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterBarProps {
  selectedCategories: EventCategory[];
  onCategoryToggle: (category: EventCategory) => void;
}

const FilterBar = ({ 
  selectedCategories, 
  onCategoryToggle 
}: FilterBarProps) => {
  const { t } = useLanguage();
  
  const categories = [
    { key: 'music' as EventCategory, label: t('category.music'), icon: '🎵' },
    { key: 'market' as EventCategory, label: t('category.market'), icon: '🛍️' },
    { key: 'party' as EventCategory, label: t('category.party'), icon: '🥂' },
    { key: 'exhibition' as EventCategory, label: t('category.exhibition'), icon: '🖼️' },
    { key: 'bar' as EventCategory, label: t('category.bar'), icon: '🎧' },
    { key: 'sports' as EventCategory, label: t('category.sports'), icon: '🏃‍♂️' }
  ];

  const viewModes = [
    { key: 'map', label: t('view.map'), icon: '🗺️' },
    { key: 'list', label: t('view.list'), icon: '📋' }
  ];

  const getCategoryColor = (category: EventCategory, isSelected: boolean) => {
    if (!isSelected) return 'bg-card/80 text-foreground border-border/50 hover:bg-muted/50';
    
    const colors = {
      music: 'bg-music text-white border-music/50',
      market: 'bg-market text-white border-market/50',
      party: 'bg-party text-white border-party/50',
      exhibition: 'bg-exhibition text-white border-exhibition/50',
      bar: 'bg-bar text-white border-bar/50',
      sports: 'bg-primary text-white border-primary/50'
    };
    return colors[category];
  };

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-1 min-w-max">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.key);
          return (
            <Badge
              key={category.key}
              variant="outline"
              className={`cursor-pointer transition-smooth whitespace-nowrap ${getCategoryColor(category.key, isSelected)}`}
              onClick={() => onCategoryToggle(category.key)}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;