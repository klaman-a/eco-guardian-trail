import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContext } from '@/contexts/SiteContext';
import { mockAssessments, filterByQuarter, CURRENT_QUARTER } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Edit3,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  Eye,
  ArrowRight,
} from 'lucide-react';

const ActiveAssessment = () => {
  const { selectedSite, isGlobalView } = useSiteContext();

  const currentAssessments = useMemo(() => {
    const all = filterByQuarter(mockAssessments, CURRENT_QUARTER.year, CURRENT_QUARTER.quarter);
    if (isGlobalView) return all;
    return all.filter(a => a.siteName === selectedSite);
  }, [isGlobalView, selectedSite]);

  if (isGlobalView) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Active Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Current quarter ({CURRENT_QUARTER.label}) assessments across all sites
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentAssessments.map(a => {
            const ncCount = a.substances.filter(s => s.complianceStatus === 'non-compliant').length;
            return (
              <div key={a.id} className="bg-card rounded-lg border border-border shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">{a.siteName}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.operationalUnit}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.id} · Rev {a.revision}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{a.substances.length} substances</span>
                  {ncCount > 0 && (
                    <span className="flex items-center gap-1 text-danger">
                      <AlertTriangle className="h-3 w-3" />{ncCount} non-compliant
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{a.lastModified}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link to={`/assessment/${a.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </Button>
                  </Link>
                  {a.status === 'pending-review' && (
                    <Link to={`/assessment/${a.id}`}>
                      <Button size="sm" className="h-8 text-xs gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Review & Approve
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {currentAssessments.length === 0 && (
          <div className="bg-card rounded-lg border border-border p-10 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No assessments for the current quarter</p>
          </div>
        )}
      </div>
    );
  }

  // Site-specific view
  const assessment = currentAssessments[0] || null;
  const hasData = assessment !== null;
  const isNotStarted = !hasData;
  const isDraft = hasData && assessment.status === 'draft';
  const isEditable = isNotStarted || isDraft;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {CURRENT_QUARTER.label} · {selectedSite ?? 'Select a site'}
        </p>
      </div>

      {isNotStarted ? (
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
          <Link to="/new-assessment">
            <Button className="gap-1.5 mt-2">
              <Plus className="h-4 w-4" /> Add Data
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          {/* Assessment header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-lg font-bold">{assessment.siteName}</h2>
                  <StatusBadge status={assessment.status} />
                </div>
                <p className="text-sm text-muted-foreground">{assessment.operationalUnit}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>{assessment.id} · Rev {assessment.revision}</span>
                  <span>Owner: {assessment.owner}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Last modified: {assessment.lastModified}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditable && (
                  <Link to="/new-assessment">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit3 className="h-3.5 w-3.5" /> Edit Data
                    </Button>
                  </Link>
                )}
                <Link to={`/assessment/${assessment.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" /> Full Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick substance summary */}
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-3">Substance Overview</h3>
            {assessment.substances.length === 0 && assessment.exempt ? (
              <p className="text-sm text-muted-foreground">Exempt — no substances to assess.</p>
            ) : (
              <div className="space-y-2">
                {assessment.substances.map(s => {
                  const isNc = s.complianceStatus === 'non-compliant';
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-md border ${
                      isNc ? 'bg-danger/5 border-danger/15' : 'bg-muted/30 border-border'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">{s.inn}</p>
                          <p className="text-xs text-muted-foreground font-mono">CAS {s.casNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold ${isNc ? 'text-danger' : 'text-success'}`}>
                            PEC/PNEC: {s.pecPnec?.toFixed(3) ?? '—'}
                          </p>
                        </div>
                        <StatusBadge status={s.complianceStatus || 'pending'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress tracker */}
          <div className="p-5 border-t border-border bg-muted/20">
            <h3 className="text-sm font-semibold mb-3">Assessment Progress</h3>
            <div className="flex items-center gap-0">
              {[
                { label: 'Enter Data', done: assessment.status !== 'not-started' },
                { label: 'Submit', done: ['submitted', 'pending-review', 'approved'].includes(assessment.status) },
                { label: 'Review', done: ['approved'].includes(assessment.status) || assessment.status === 'pending-review' },
                { label: 'Approved', done: assessment.status === 'approved' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1.5 ${step.done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 flex-1 -mt-4 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Additional assessments for same site */}
      {currentAssessments.length > 1 && (
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-3">Other Active Assessments</h3>
          <div className="space-y-2">
            {currentAssessments.slice(1).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium">{a.operationalUnit}</p>
                  <p className="text-xs text-muted-foreground">{a.id} · Rev {a.revision}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Link to={`/assessment/${a.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAssessment;
