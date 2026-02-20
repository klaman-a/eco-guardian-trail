import { mockAssessments } from '@/data/mockData';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Building2,
} from 'lucide-react';

const Dashboard = () => {
  const allSubstances = mockAssessments.flatMap((a) => a.substances);
  const totalSubstances = allSubstances.length;
  const compliantCount = allSubstances.filter((s) => s.complianceStatus === 'compliant').length;
  const nonCompliantCount = allSubstances.filter((s) => s.complianceStatus === 'non-compliant').length;
  const exemptCount = allSubstances.filter((s) => s.complianceStatus === 'exempt').length;
  const pendingAssessments = mockAssessments.filter((a) => a.status === 'pending-review' || a.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Environmental risk overview across all manufacturing sites
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assessments"
          value={mockAssessments.length}
          subtitle={`${pendingAssessments} pending action`}
          icon={FileText}
        />
        <MetricCard
          title="Drug Substances"
          value={totalSubstances}
          subtitle={`${exemptCount} exempt`}
          icon={FlaskConical}
        />
        <MetricCard
          title="Compliant"
          value={compliantCount}
          subtitle="PEC/PNEC < 1.0"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Non-Compliant"
          value={nonCompliantCount}
          subtitle="CAPA required"
          icon={AlertTriangle}
          variant={nonCompliantCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Assessments table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Recent Assessments</h2>
          <Link
            to="/assessments"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Site</th>
                <th>Period</th>
                <th>Substances</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Modified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockAssessments.map((assessment) => {
                const ncCount = assessment.substances.filter(
                  (s) => s.complianceStatus === 'non-compliant'
                ).length;
                return (
                  <tr key={assessment.id}>
                    <td className="font-mono text-xs font-medium">{assessment.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{assessment.siteName}</p>
                          <p className="text-xs text-muted-foreground">{assessment.operationalUnit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{assessment.reportingPeriod}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{assessment.substances.length}</span>
                        {ncCount > 0 && (
                          <span className="flex items-center gap-0.5 text-danger text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {ncCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={assessment.status} /></td>
                    <td className="text-sm">{assessment.owner}</td>
                    <td className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.lastModified}
                      </div>
                    </td>
                    <td>
                      <Link
                        to={`/assessment/${assessment.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            Outstanding Actions
          </h3>
          <div className="space-y-2.5">
            {allSubstances
              .filter((s) => s.complianceStatus === 'non-compliant')
              .map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-2.5 rounded-md bg-danger/5 border border-danger/10">
                  <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.inn}</p>
                    <p className="text-xs text-muted-foreground">
                      PEC/PNEC = {s.pecPnec?.toFixed(2) ?? '—'} · Initiate CAPA and record in risk portfolio
                    </p>
                  </div>
                </div>
              ))}
            {allSubstances.filter((s) => s.complianceStatus === 'non-compliant').length === 0 && (
              <p className="text-sm text-muted-foreground">No outstanding actions</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Pending Reviews
          </h3>
          <div className="space-y-2.5">
            {mockAssessments
              .filter((a) => a.status === 'pending-review' || a.status === 'draft')
              .map((a) => (
                <Link
                  key={a.id}
                  to={`/assessment/${a.id}`}
                  className="flex items-center justify-between p-2.5 rounded-md bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{a.siteName}</p>
                    <p className="text-xs text-muted-foreground">{a.id} · Rev {a.revision}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
