import { ComplianceStatus, ApprovalStatus, RiskZone } from '@/types/assessment';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: ComplianceStatus | ApprovalStatus }) {
  const config: Record<string, string> = {
    compliant: 'status-badge-compliant',
    'non-compliant': 'status-badge-non-compliant',
    pending: 'status-badge-pending',
    draft: 'status-badge-draft',
    'not-started': 'status-badge-draft',
    submitted: 'status-badge-pending',
    exempt: 'status-badge-draft',
    approved: 'status-badge-compliant',
    'pending-review': 'status-badge-pending',
    'signed-off': 'status-badge-signed-off',
    locked: 'status-badge-draft',
  };

  const labels: Record<string, string> = {
    compliant: 'Compliant',
    'non-compliant': 'Non-Compliant',
    pending: 'Pending',
    draft: 'Draft',
    'not-started': 'Not Started',
    submitted: 'Submitted',
    exempt: 'Exempt',
    approved: 'Approved',
    'pending-review': 'Pending Review',
    'signed-off': 'Signed Off',
    locked: 'Locked',
  };

  return (
    <span className={cn(config[status] || 'status-badge-draft')}>
      {labels[status] || status}
    </span>
  );
}

export function RiskBadge({ zone }: { zone: RiskZone }) {
  const config: Record<RiskZone, string> = {
    compliant: 'status-badge-compliant',
    low: 'bg-[hsl(175,55%,40%)]/10 text-[hsl(175,55%,30%)] border border-[hsl(175,55%,40%)]/20 px-2.5 py-0.5 rounded-full text-xs font-medium',
    medium: 'status-badge-pending',
    high: 'status-badge-non-compliant',
  };
  const labels: Record<RiskZone, string> = {
    compliant: 'Compliant',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return <span className={cn(config[zone])}>{labels[zone]}</span>;
}
