import { UnitType, WindowType } from '@/types/market';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LadderControlsProps {
  unit: UnitType;
  window: WindowType;
  onUnitChange: (unit: UnitType) => void;
  onWindowChange: (window: WindowType) => void;
}

export function LadderControls({ 
  unit, 
  window, 
  onUnitChange, 
  onWindowChange 
}: LadderControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Unit Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Unit:</span>
        <div className="flex rounded-md border p-1">
          <Button
            variant={unit === 'USD' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onUnitChange('USD')}
            className="h-8 px-3 text-xs"
          >
            USD
          </Button>
          <Button
            variant={unit === 'Tokens' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onUnitChange('Tokens')}
            className="h-8 px-3 text-xs"
          >
            Tokens
          </Button>
        </div>
      </div>

      {/* Window Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Window:</span>
        <div className="flex rounded-md border p-1">
          <Button
            variant={window === 1 ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onWindowChange(1)}
            className="h-8 px-3 text-xs"
          >
            ±1%
          </Button>
          <Button
            variant={window === 3 ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onWindowChange(3)}
            className="h-8 px-3 text-xs"
          >
            ±3%
          </Button>
        </div>
      </div>
    </div>
  );
}