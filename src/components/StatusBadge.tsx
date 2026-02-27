import { ComplianceStatus, ApprovalStatus } from '@/types/assessment';
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
    locked: 'Locked',
  };

  return (
    <span className={cn(config[status] || 'status-badge-draft')}>
      {labels[status] || status}
    </span>
  );
}
