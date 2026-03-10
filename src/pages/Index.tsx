import { mockAssessments, filterByQuarter, CURRENT_QUARTER } from '@/data/mockData';
import { useSiteContext } from '@/contexts/SiteContext';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { QuarterSelector } from '@/components/QuarterSelector';
import { GraphicalDashboard } from '@/components/GraphicalDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  CheckCircle2, FileText, Clock, ArrowRight, Building2,
  AlertTriangle, Eye, Wrench, Search, PenLine, ShieldCheck,
  BarChart3, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type MetricFilter = 'all' | 'signed-off' | 'outstanding' | 'in-review' | 'approved' | 'pending-review';

const Dashboard = () => {
  const { selectedSite, isGlobalView } = useSiteContext();
  const [activeFilter, setActiveFilter] = useState<MetricFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(CURRENT_QUARTER.year);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(CURRENT_QUARTER.quarter);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const siteAssessments = useMemo(() => {
    const base = isGlobalView ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite);
    if (showAllHistory) return base;
    return filterByQuarter(base, selectedYear, selectedQuarter);
  }, [isGlobalView, selectedSite, selectedYear, selectedQuarter, showAllHistory]);

  const signedOffCount = siteAssessments.filter(a => a.status === 'signed-off').length;
  const approvedCount = siteAssessments.filter(a => a.status === 'approved').length;
  const outstandingCount = siteAssessments.filter(a => a.status === 'draft' || a.status === 'not-started').length;
  const inReviewCount = siteAssessments.filter(a => a.status === 'pending-review').length;
  const submittedCount = siteAssessments.filter(a => a.status === 'submitted').length;

  const filteredAssessments = useMemo(() => {
    switch (activeFilter) {
      case 'signed-off': return siteAssessments.filter(a => a.status === 'signed-off');
      case 'approved': return siteAssessments.filter(a => a.status === 'approved');
      case 'outstanding': return siteAssessments.filter(a => a.status === 'draft' || a.status === 'not-started');
      case 'in-review': return siteAssessments.filter(a => a.status === 'pending-review');
      case 'pending-review': return siteAssessments.filter(a => a.status === 'pending-review');
      default: return siteAssessments;
    }
  }, [siteAssessments, activeFilter]);

  const nonCompliantSites = useMemo(() => {
    const siteMap: Record<string, { siteName: string; assessmentId: string; substances: string[] }> = {};
    siteAssessments.forEach(a => {
      const ncSubs = a.substances.filter(s => s.complianceStatus === 'non-compliant');
      if (ncSubs.length > 0) {
        if (!siteMap[a.siteName]) siteMap[a.siteName] = { siteName: a.siteName, assessmentId: a.id, substances: [] };
        ncSubs.forEach(s => { if (!siteMap[a.siteName].substances.includes(s.inn)) siteMap[a.siteName].substances.push(s.inn); });
      }
    });
    return Object.values(siteMap);
  }, [siteAssessments]);

  const pendingReviews = siteAssessments.filter(a => a.status === 'pending-review');

  const toggleFilter = (filter: MetricFilter) => {
    setActiveFilter(prev => prev === filter ? 'all' : filter);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobalView ? 'Environmental risk overview across all sites' : `Overview for ${selectedSite}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="control-panel">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="bg-muted">
            <TabsTrigger value="control-panel" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Control Panel
            </TabsTrigger>
            <TabsTrigger value="graphical" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Graphical Dashboard
            </TabsTrigger>
          </TabsList>
          <QuarterSelector
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            showAllHistory={showAllHistory}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onToggleAllHistory={() => {
              setShowAllHistory(prev => !prev);
              if (!showAllHistory) { setSelectedYear(null); setSelectedQuarter(null); }
              else { setSelectedYear(CURRENT_QUARTER.year); setSelectedQuarter(CURRENT_QUARTER.quarter); }
            }}
          />
        </div>

        <TabsContent value="control-panel" className="space-y-6 mt-4">
          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard title="Signed Off" value={signedOffCount} subtitle="Fully complete" icon={ShieldCheck}
              variant="success" active={activeFilter === 'signed-off'} onClick={() => toggleFilter('signed-off')} />
            <MetricCard title="Approved" value={approvedCount} subtitle="Awaiting sign-off" icon={CheckCircle2}
              variant="success" active={activeFilter === 'approved'} onClick={() => toggleFilter('approved')} />
            <MetricCard title="Outstanding" value={outstandingCount} subtitle="Draft / not started" icon={PenLine}
              variant="warning" active={activeFilter === 'outstanding'} onClick={() => toggleFilter('outstanding')} />
            <MetricCard title="In Review" value={inReviewCount} subtitle="Pending approval" icon={Search}
              variant="default" active={activeFilter === 'in-review'} onClick={() => toggleFilter('in-review')} />
            <MetricCard title="Submitted" value={submittedCount} subtitle="Awaiting review" icon={FileText}
              variant="default" active={activeFilter === 'pending-review'} onClick={() => toggleFilter('pending-review')} />
          </div>

          {/* Assessment table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">
                {activeFilter === 'all' ? 'All Assessments' : `Filtered: ${activeFilter.replace('-', ' ')}`}
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
                    <th>ID</th><th>Site</th><th>Period</th><th>Substances</th><th>Status</th><th>Owner</th><th>Modified</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No assessments match</td></tr>
                  )}
                  {filteredAssessments.slice(0, 10).map(a => {
                    const nc = a.substances.filter(s => s.complianceStatus === 'non-compliant').length;
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
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{a.substances.length}</span>
                            {nc > 0 && <span className="flex items-center gap-0.5 text-danger text-xs"><AlertTriangle className="h-3 w-3" />{nc}</span>}
                          </div>
                        </td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="text-sm">{a.owner}</td>
                        <td className="text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.lastModified}</span></td>
                        <td><Link to={`/assessment/${a.id}`} className="text-xs font-medium text-primary hover:underline">Open</Link></td>
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
                  <p className="text-sm text-muted-foreground py-2">No non-compliant sites</p>
                )}
                {nonCompliantSites.map(site => (
                  <div key={site.siteName} className="p-3 rounded-md bg-danger/5 border border-danger/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-danger shrink-0" />{site.siteName}
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
                          <Wrench className="h-3 w-3" /> CAPA
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
                      <p className="text-xs text-muted-foreground">{a.id} · {a.reportingPeriod}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <Link to={`/assessment/${a.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Eye className="h-3 w-3" /> {isGlobalView ? 'Review' : 'View'}
                        </Button>
                      </Link>
                      {isGlobalView && (
                        <Button variant="default" size="sm" className="h-7 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="graphical" className="mt-4">
          <GraphicalDashboard
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            showAllHistory={showAllHistory}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onToggleAllHistory={() => {
              setShowAllHistory(prev => !prev);
              if (!showAllHistory) { setSelectedYear(null); setSelectedQuarter(null); }
              else { setSelectedYear(CURRENT_QUARTER.year); setSelectedQuarter(CURRENT_QUARTER.quarter); }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
