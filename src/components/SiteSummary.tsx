import { Assessment } from '@/types/assessment';
import { MetricCard } from '@/components/MetricCard';
import { FlaskConical, AlertTriangle, CheckCircle2, Droplets } from 'lucide-react';

interface SiteSummaryProps {
  assessment: Assessment;
}

export function SiteSummary({ assessment }: SiteSummaryProps) {
  const subs = assessment.substances;
  const totalProcessed = subs.reduce((sum, s) => sum + (s.annualProcessed || 0), 0);
  const totalLoadWW = subs.reduce((sum, s) => sum + (s.annualLoadToWastewater || 0), 0);
  const compliant = subs.filter((s) => s.complianceStatus === 'compliant').length;
  const nonCompliant = subs.filter((s) => s.complianceStatus === 'non-compliant').length;
  const exempt = subs.filter((s) => s.complianceStatus === 'exempt').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Processed" value={`${totalProcessed.toLocaleString()} kg`} subtitle="Annual worst-case" icon={FlaskConical} />
        <MetricCard title="Total Load to WW" value={`${totalLoadWW.toFixed(1)} kg`} subtitle="Annual load" icon={Droplets} />
        <MetricCard title="Compliant" value={compliant} subtitle={`${exempt} exempt`} icon={CheckCircle2} variant="success" />
        <MetricCard title="Non-Compliant" value={nonCompliant} subtitle="Requires CAPA" icon={AlertTriangle} variant={nonCompliant > 0 ? 'danger' : 'success'} />
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="font-semibold text-sm">Substance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Substance</th>
                <th>CAS</th>
                <th>Processed (kg/yr)</th>
                <th>Load to WW (kg/yr)</th>
                <th>PEC/PNEC</th>
                <th>MEC/PNEC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-sm">{s.inn}</td>
                  <td className="font-mono text-xs">{s.casNumber}</td>
                  <td className="font-mono text-sm">{s.annualProcessed?.toLocaleString() ?? '—'}</td>
                  <td className="font-mono text-sm">{s.annualLoadToWastewater?.toFixed(1) ?? '—'}</td>
                  <td className={`font-mono text-sm font-bold ${(s.pecPnec ?? 0) >= 1 ? 'text-danger' : 'text-success'}`}>
                    {s.pecPnec?.toFixed(3) ?? '—'}
                  </td>
                  <td className={`font-mono text-sm font-bold ${(s.mecPnec ?? 0) >= 1 ? 'text-danger' : s.mecPnec !== null && s.mecPnec !== undefined ? 'text-success' : ''}`}>
                    {s.mecPnec !== null && s.mecPnec !== undefined ? s.mecPnec.toFixed(3) : '—'}
                  </td>
                  <td>
                    <span className={`text-xs font-medium ${s.complianceStatus === 'compliant' ? 'text-success' : s.complianceStatus === 'non-compliant' ? 'text-danger' : 'text-muted-foreground'}`}>
                      {s.complianceStatus === 'compliant' ? '✓ Pass' : s.complianceStatus === 'non-compliant' ? '✗ Fail' : s.complianceStatus === 'exempt' ? 'Exempt' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
