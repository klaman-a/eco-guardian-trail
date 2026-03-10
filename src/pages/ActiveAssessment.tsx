import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSiteContext } from '@/contexts/SiteContext';
import { mockAssessments, filterByQuarter, CURRENT_QUARTER } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { getProgressMilestones, getEditButtonText } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import {
  FileText, Plus, Clock, Building2, AlertTriangle,
  ArrowRight, Edit3, Send, Lock,
} from 'lucide-react';

const ActiveAssessment = () => {
  const { selectedSite, isGlobalView } = useSiteContext();

  if (isGlobalView) {
    return <Navigate to="/" replace />;
  }

  const assessment = useMemo(() => {
    const all = filterByQuarter(mockAssessments, CURRENT_QUARTER.year, CURRENT_QUARTER.quarter);
    return all.find(a => a.siteName === selectedSite) ?? null;
  }, [selectedSite]);

  const hasData = assessment !== null;
  const milestones = hasData ? getProgressMilestones(assessment) : [];
  const editText = hasData ? getEditButtonText(assessment.status, assessment.reviewStarted) : 'Enter Data';

  const ncCount = hasData ? assessment.substances.filter(s => s.complianceStatus === 'non-compliant').length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assessment Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {CURRENT_QUARTER.label} · {selectedSite ?? 'Select a site'}
        </p>
      </div>

      {!hasData ? (
        <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mx-auto">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No Assessment Started</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Start your effluent risk assessment for {CURRENT_QUARTER.label}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <StatusBadge status="not-started" />
          </div>
          <Link to="/data-entry">
            <Button className="gap-1.5 mt-2">
              <Plus className="h-4 w-4" /> Enter Data
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-lg font-bold">{assessment.siteName}</h2>
                  <StatusBadge status={assessment.status} />
                </div>
                <p className="text-sm text-muted-foreground">{assessment.operationalUnit}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>{assessment.id} · Rev {assessment.revision}</span>
                  <span>Owner: {assessment.owner}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {assessment.lastModified}
                  </span>
                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    Formula {assessment.formulaVersion}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editText && (
                  <Link to="/data-entry">
                    <Button variant={editText === 'Request Edit' ? 'outline' : 'default'} size="sm" className="gap-1.5">
                      {editText === 'Request Edit' ? <Lock className="h-3.5 w-3.5" /> :
                       editText === 'Enter Data' ? <Plus className="h-3.5 w-3.5" /> :
                       <Edit3 className="h-3.5 w-3.5" />}
                      {editText}
                    </Button>
                  </Link>
                )}
                <Link to={`/assessment/${assessment.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" /> Full Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Substance overview */}
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-3">Substance Overview</h3>
            {assessment.exempt ? (
              <p className="text-sm text-muted-foreground">Exempt — no substances to assess.</p>
            ) : (
              <div className="space-y-2">
                {assessment.substances.map(s => {
                  const isNc = s.complianceStatus === 'non-compliant';
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-md border ${
                      isNc ? 'bg-danger/5 border-danger/15' : 'bg-muted/30 border-border'
                    }`}>
                      <div>
                        <p className="text-sm font-medium">{s.inn}</p>
                        <p className="text-xs text-muted-foreground font-mono">CAS {s.casNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-mono font-bold ${isNc ? 'text-danger' : 'text-success'}`}>
                          PEC/PNEC: {s.pecPnec?.toFixed(3) ?? '—'}
                        </p>
                        <StatusBadge status={s.complianceStatus || 'pending'} />
                      </div>
                    </div>
                  );
                })}
                {ncCount > 0 && (
                  <div className="flex items-center gap-2 p-2 text-xs text-danger">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {ncCount} substance{ncCount > 1 ? 's' : ''} non-compliant — CAPA required
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="p-5 border-t border-border bg-muted/20">
            <h3 className="text-sm font-semibold mb-4">Assessment Progress</h3>
            <ProgressTracker milestones={milestones} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAssessment;
