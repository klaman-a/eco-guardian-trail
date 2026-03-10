import { ProgressMilestone } from '@/types/assessment';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  milestones: ProgressMilestone[];
}

export function ProgressTracker({ milestones }: ProgressTrackerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-0">
        {milestones.map((m, i) => (
          <div key={m.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="flex flex-col items-center group"
              >
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  m.done
                    ? 'bg-primary text-primary-foreground'
                    : m.active
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground border border-border'
                )}>
                  {m.done ? <CheckCircle2 className="h-4.5 w-4.5" /> : i + 1}
                </div>
                <span className={cn(
                  'text-xs mt-1.5 flex items-center gap-0.5',
                  m.done ? 'text-primary font-medium' : m.active ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {m.label}
                  {expandedIndex === i ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  )}
                </span>
              </button>
            </div>
            {i < milestones.length - 1 && (
              <div className={cn('h-0.5 flex-1 -mt-5', m.done ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Expanded substeps */}
      {expandedIndex !== null && milestones[expandedIndex] && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-border space-y-2">
          {milestones[expandedIndex].substeps.map((sub, si) => (
            <div key={si} className="flex items-center gap-2.5">
              {sub.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                'text-sm',
                sub.done ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {sub.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
