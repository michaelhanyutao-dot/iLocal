import { Button } from '@/components/ui/button';
import { List, Map } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloatingViewToggleProps {
  viewMode: 'map' | 'list';
  onViewModeChange: (mode: 'map' | 'list') => void;
}

const FloatingViewToggle = ({ viewMode, onViewModeChange }: FloatingViewToggleProps) => {
  const { t } = useLanguage();
  
  const viewModes = [
    { key: 'map' as const, label: t('view.map'), icon: Map },
    { key: 'list' as const, label: t('view.list'), icon: List }
  ];

  return (
    <div className="fixed bottom-[84px] left-1/2 z-40 -translate-x-1/2">
      <div className="flex gap-1 rounded-full border border-border/80 bg-card/95 p-1 shadow-float backdrop-blur-xl">
        {viewModes.map((mode) => {
          const isSelected = viewMode === mode.key;
          const Icon = mode.icon;
          return (
            <Button
              key={mode.key}
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange(mode.key)}
              className={`h-12 rounded-full px-5 text-base font-bold transition-smooth ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="mr-2 h-5 w-5" />
              {mode.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingViewToggle;
