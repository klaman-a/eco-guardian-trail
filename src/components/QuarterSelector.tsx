import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuarterSelectorProps {
  selectedYear: number | null;
  selectedQuarter: number | null;
  showAllHistory: boolean;
  onYearChange: (year: number | null) => void;
  onQuarterChange: (quarter: number | null) => void;
  onToggleAllHistory: () => void;
}

const YEARS = [2025, 2024];
const QUARTERS = [
  { value: '1', label: 'Q1' },
  { value: '2', label: 'Q2' },
  { value: '3', label: 'Q3' },
  { value: '4', label: 'Q4' },
];

export function QuarterSelector({
  selectedYear, selectedQuarter, showAllHistory,
  onYearChange, onQuarterChange, onToggleAllHistory,
}: QuarterSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {!showAllHistory && (
        <>
          <Select
            value={selectedYear?.toString() ?? ''}
            onValueChange={(v) => onYearChange(parseInt(v))}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {YEARS.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedQuarter?.toString() ?? ''}
            onValueChange={(v) => onQuarterChange(parseInt(v))}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue placeholder="Qtr" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {QUARTERS.map(q => (
                <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
      <Button
        variant={showAllHistory ? 'default' : 'outline'}
        size="sm"
        className={cn('h-8 text-xs gap-1.5', showAllHistory && 'bg-primary text-primary-foreground')}
        onClick={onToggleAllHistory}
      >
        <History className="h-3.5 w-3.5" />
        {showAllHistory ? 'All History' : 'All'}
      </Button>
    </div>
  );
}
