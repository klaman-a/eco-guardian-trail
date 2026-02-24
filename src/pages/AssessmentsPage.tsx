import { mockAssessments } from '@/data/mockData';
import { useSiteContext } from '@/contexts/SiteContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { Building2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AssessmentsPage = () => {
  const { selectedSite, isGlobalView } = useSiteContext();

  const assessments = isGlobalView
    ? mockAssessments
    : mockAssessments.filter(a => a.siteName === selectedSite);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobalView ? 'All effluent risk assessments across sites' : `Assessments for ${selectedSite}`}
          </p>
        </div>
        {!isGlobalView && (
          <Link to="/new-assessment">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> New Assessment
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Site / Unit</th>
                <th>Period</th>
                <th>Rev</th>
                <th>Substances</th>
                <th>Non-Compliant</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Last Modified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const nc = a.substances.filter((s) => s.complianceStatus === 'non-compliant').length;
                return (
                  <tr key={a.id}>
                    <td className="font-mono text-xs font-medium">{a.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{a.siteName}</p>
                          <p className="text-xs text-muted-foreground">{a.operationalUnit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{a.reportingPeriod}</td>
                    <td className="text-sm text-center">{a.revision}</td>
                    <td className="text-sm text-center">{a.substances.length}</td>
                    <td className="text-center">
                      {nc > 0 ? (
                        <span className="inline-flex items-center gap-1 text-danger text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />{nc}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-sm">{a.owner}</td>
                    <td className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.lastModified}</span>
                    </td>
                    <td>
                      <Link to={`/assessment/${a.id}`} className="text-xs font-medium text-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsPage;
