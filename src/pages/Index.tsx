import { mockAssessments, filterByQuarter, CURRENT_QUARTER } from '@/data/mockData';
import { useSiteContext } from '@/contexts/SiteContext';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { QuarterSelector } from '@/components/QuarterSelector';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Building2,
  AlertTriangle,
  Eye,
  Wrench,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type MetricFilter = 'all' | 'approved' | 'outstanding' | 'in-review' | 'non-compliant';

const Dashboard = () => {
  const { selectedSite, isGlobalView } = useSiteContext();
  const [activeFilter, setActiveFilter] = useState<MetricFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_QUARTER.year);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(CURRENT_QUARTER.quarter);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Filter by site
  const siteAssessments = useMemo(() => {
    const base = isGlobalView ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite);
    if (showAllHistory) return base;
    return filterByQuarter(base, selectedYear, selectedQuarter);
  }, [isGlobalView, selectedSite, selectedYear, selectedQuarter, showAllHistory]);

  // Metrics
  const approvedCount = siteAssessments.filter(a => a.status === 'approved').length;
  const outstandingCount = siteAssessments.filter(a => a.status === 'draft').length;
  const inReviewCount = siteAssessments.filter(a => a.status === 'pending-review').length;
  const nonCompliantSubs = siteAssessments.flatMap(a => a.substances.filter(s => s.complianceStatus === 'non-compliant'));
  const nonCompliantCount = nonCompliantSubs.length;

  // Filtered table
  const filteredAssessments = useMemo(() => {
    switch (activeFilter) {
      case 'approved': return siteAssessments.filter(a => a.status === 'approved');
      case 'outstanding': return siteAssessments.filter(a => a.status === 'draft');
      case 'in-review': return siteAssessments.filter(a => a.status === 'pending-review');
      case 'non-compliant': return siteAssessments.filter(a => a.substances.some(s => s.complianceStatus === 'non-compliant'));
      default: return siteAssessments;
    }
  }, [siteAssessments, activeFilter]);

  // Non-compliant sites grouping
  const nonCompliantSites = useMemo(() => {
    const siteMap: Record<string, { siteName: string; assessmentId: string; substances: string[] }> = {};
    siteAssessments.forEach(a => {
      const ncSubs = a.substances.filter(s => s.complianceStatus === 'non-compliant');
      if (ncSubs.length > 0) {
        if (!siteMap[a.siteName]) {
          siteMap[a.siteName] = { siteName: a.siteName, assessmentId: a.id, substances: [] };
        }
        ncSubs.forEach(s => {
          if (!siteMap[a.siteName].substances.includes(s.inn)) {
            siteMap[a.siteName].substances.push(s.inn);
          }
        });
      }
    });
    return Object.values(siteMap);
  }, [siteAssessments]);

  // Pending reviews
  const pendingReviews = siteAssessments.filter(a => a.status === 'pending-review');

  const toggleFilter = (filter: MetricFilter) => {
    setActiveFilter(prev => prev === filter ? 'all' : filter);
  };

  return (
    <div className="space-y-6">
      {/* Header with quarter selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobalView
              ? 'Environmental risk overview across all manufacturing sites'
              : `Environmental risk overview for ${selectedSite}`}
          </p>
        </div>
        <QuarterSelector
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          showAllHistory={showAllHistory}
          onYearChange={setSelectedYear}
          onQuarterChange={setSelectedQuarter}
          onToggleAllHistory={() => {
            setShowAllHistory(prev => !prev);
            if (!showAllHistory) {
              setSelectedYear(null);
              setSelectedQuarter(null);
            } else {
              setSelectedYear(CURRENT_QUARTER.year);
              setSelectedQuarter(CURRENT_QUARTER.quarter);
            }
          }}
        />
      </div>

      {/* Metric cards – clickable filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Approved" value={approvedCount}
          subtitle="Completed assessments" icon={CheckCircle2}
          variant="success"
          active={activeFilter === 'approved'}
          onClick={() => toggleFilter('approved')}
        />
        <MetricCard
          title="Outstanding" value={outstandingCount}
          subtitle="Draft / not submitted" icon={FileText}
          variant="warning"
          active={activeFilter === 'outstanding'}
          onClick={() => toggleFilter('outstanding')}
        />
        <MetricCard
          title="In Review" value={inReviewCount}
          subtitle="Pending approval" icon={Search}
          variant="default"
          active={activeFilter === 'in-review'}
          onClick={() => toggleFilter('in-review')}
        />
        <MetricCard
          title="Non-Compliant" value={nonCompliantCount}
          subtitle="Substances exceeding limits" icon={AlertTriangle}
          variant={nonCompliantCount > 0 ? 'danger' : 'success'}
          active={activeFilter === 'non-compliant'}
          onClick={() => toggleFilter('non-compliant')}
        />
      </div>

      {/* Assessments table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">
            {activeFilter === 'all' ? 'All Assessments' :
             activeFilter === 'approved' ? 'Approved Assessments' :
             activeFilter === 'outstanding' ? 'Outstanding Assessments' :
             activeFilter === 'in-review' ? 'Assessments In Review' :
             'Non-Compliant Assessments'}
            <span className="ml-2 text-xs font-normal text-muted-foreground">({filteredAssessments.length})</span>
          </h2>
          <Link to="/assessments" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
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
              {filteredAssessments.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No assessments match the selected filter</td></tr>
              )}
              {filteredAssessments.map((assessment) => {
                const ncCount = assessment.substances.filter(s => s.complianceStatus === 'non-compliant').length;
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
                            <AlertTriangle className="h-3 w-3" />{ncCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={assessment.status} /></td>
                    <td className="text-sm">{assessment.owner}</td>
                    <td className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{assessment.lastModified}</div>
                    </td>
                    <td>
                      <Link to={`/assessment/${assessment.id}`} className="text-xs font-medium text-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Non-Compliant Sites */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" /> Non-Compliant Sites
          </h3>
          <div className="space-y-3">
            {nonCompliantSites.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No non-compliant sites for this period</p>
            )}
            {nonCompliantSites.map(site => (
              <div key={site.siteName} className="p-3 rounded-md bg-danger/5 border border-danger/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-danger shrink-0" />
                      {site.siteName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {site.substances.map(sub => (
                        <span key={sub} className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full">
                          <AlertTriangle className="h-2.5 w-2.5" />{sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link to={`/assessment/${site.assessmentId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 w-full">
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-danger border-danger/30 hover:bg-danger/10">
                      <Wrench className="h-3 w-3" /> Initiate CAPA
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" /> Pending Reviews
          </h3>
          <div className="space-y-2.5">
            {pendingReviews.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No assessments pending review</p>
            )}
            {pendingReviews.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-warning/5 border border-warning/10">
                <div>
                  <p className="text-sm font-medium">{a.siteName}</p>
                  <p className="text-xs text-muted-foreground">{a.id} · {a.reportingPeriod} · Rev {a.revision}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Link to={`/assessment/${a.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="h-3 w-3" />
                      {isGlobalView ? 'Review' : 'View'}
                    </Button>
                  </Link>
                  {isGlobalView && (
                    <Button variant="default" size="sm" className="h-7 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                  )}
                  {!isGlobalView && (
                    <Link to={`/assessment/${a.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
