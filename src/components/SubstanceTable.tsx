import { DrugSubstance } from '@/types/assessment';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertTriangle, Beaker, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SubstanceTableProps {
  substances: DrugSubstance[];
}

export function SubstanceTable({ substances }: SubstanceTableProps) {
  if (substances.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-10 text-center">
        <Beaker className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No drug substances added</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {substances.map((s) => (
        <div
          key={s.id}
          className="bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-fade-in"
        >
          {/* Substance header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-sm">{s.inn}</h3>
                <p className="text-xs text-muted-foreground font-mono">CAS {s.casNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {s.assessmentStep === 'step2' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Step 2 Refined
                </span>
              )}
              <StatusBadge status={s.complianceStatus || 'pending'} />
            </div>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            <DataCell label="PNEC" value={s.pnecValue ? `${s.pnecValue} µg/L` : '—'} sublabel={s.pnecSource} />
            <DataCell label="Annual Processed" value={s.annualProcessed ? `${s.annualProcessed.toLocaleString()} kg` : '—'} />
            <DataCell label="Annual Loss" value={s.annualLoss ? `${s.annualLoss.toFixed(1)} kg` : '—'} sublabel={s.percentageLoss ? `${s.percentageLoss.toFixed(2)}%` : undefined} />
            <DataCell label="Load to WW" value={s.annualLoadToWastewater ? `${s.annualLoadToWastewater.toFixed(1)} kg` : '—'} />
            <DataCell label="PEC Effluent" value={s.pecEffluent !== undefined ? `${s.pecEffluent.toFixed(3)} µg/L` : '—'} />
            <DataCell label="PEC Surface Water" value={s.pecSurfaceWater !== undefined ? `${s.pecSurfaceWater.toFixed(4)} µg/L` : '—'} />
          </div>

          {/* Control parameters */}
          <div className="px-5 py-3 flex flex-wrap items-center gap-4 text-sm border-t border-border">
            <ControlParam
              label="PEC/PNEC"
              value={s.pecPnec}
              threshold={1.0}
            />
            {s.mecPnec !== null && s.mecPnec !== undefined && (
              <ControlParam
                label="MEC/PNEC"
                value={s.mecPnec}
                threshold={1.0}
              />
            )}
            {s.measuredConcentration !== null && s.measuredConcentration !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">MEC:</span>
                <span className="text-xs font-mono font-medium">{s.measuredConcentration} µg/L</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Dilution:</span>
              <span className="text-xs font-mono font-medium">1:{s.dilutionFactor || 10}</span>
            </div>
            {s.treatmentEliminationRate !== undefined && s.treatmentEliminationRate > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Treatment:</span>
                <span className="text-xs font-mono font-medium">{s.treatmentEliminationRate}% elimination</span>
              </div>
            )}
          </div>

          {/* Non-compliant warning */}
          {s.complianceStatus === 'non-compliant' && (
            <div className="px-5 py-2.5 bg-danger/5 border-t border-danger/10 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
              <p className="text-xs text-danger">
                Control limit exceeded — record in site risk portfolio and initiate corrective action.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DataCell({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-medium font-mono mt-0.5">{value}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
  );
}

function ControlParam({ label, value, threshold }: { label: string; value?: number; threshold: number }) {
  const exceeds = value !== undefined && value >= threshold;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={`text-sm font-mono font-bold ${exceeds ? 'text-danger' : 'text-success'}`}>
        {value !== undefined ? value.toFixed(3) : '—'}
      </span>
      {exceeds && <AlertTriangle className="h-3 w-3 text-danger" />}
    </div>
  );
}
