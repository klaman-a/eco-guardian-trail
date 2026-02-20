import { ChecklistItem } from '@/types/assessment';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle } from 'lucide-react';

interface AssessmentChecklistProps {
  items: ChecklistItem[];
}

export function AssessmentChecklist({ items: initialItems }: AssessmentChecklistProps) {
  const [items, setItems] = useState(initialItems);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const allComplete = completedCount === totalCount;

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Implementation Self-Assessment</h3>
          <span className="text-xs font-medium text-muted-foreground">
            {completedCount} / {totalCount} complete
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
        {allComplete && (
          <p className="text-xs text-success mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All items confirmed — ready for approval
          </p>
        )}
      </div>

      {/* Checklist by category */}
      {categories.map((cat) => (
        <div key={cat} className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-2.5 bg-muted/30 border-b border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h4>
          </div>
          <div className="divide-y divide-border/50">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-0.5"
                  />
                  <span className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                    {item.text}
                  </span>
                </label>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
