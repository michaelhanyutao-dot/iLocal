import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloatingViewToggleProps {
  viewMode: 'map' | 'list';
  onViewModeChange: (mode: 'map' | 'list') => void;
}

const FloatingViewToggle = ({ viewMode, onViewModeChange }: FloatingViewToggleProps) => {
  const { t } = useLanguage();
  
  const viewModes = [
    { key: 'map', label: t('view.map'), icon: '🗺️' },
    { key: 'list', label: t('view.list'), icon: '📋' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex gap-1 p-1 bg-background/90 backdrop-blur-lg rounded-full shadow-xl border border-border/50">
        {viewModes.map((mode) => {
          const isSelected = viewMode === mode.key;
          return (
            <Button
              key={mode.key}
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange(mode.key as 'map' | 'list')}
              className={`transition-smooth px-4 py-2 rounded-full ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="mr-2">{mode.icon}</span>
              {mode.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingViewToggle;