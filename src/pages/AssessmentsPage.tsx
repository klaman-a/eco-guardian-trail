import { mockAssessments, filterByQuarter, CURRENT_QUARTER, AVAILABLE_QUARTERS } from '@/data/mockData';
import { useSiteContext, SITES } from '@/contexts/SiteContext';
import { StatusBadge } from '@/components/StatusBadge';
import { QuarterSelector } from '@/components/QuarterSelector';
import { Link } from 'react-router-dom';
import { Building2, Clock, AlertTriangle, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';

const AssessmentsPage = () => {
  const { selectedSite, isGlobalView } = useSiteContext();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [siteFilter, setSiteFilter] = useState<string[]>([]);

  const assessments = useMemo(() => {
    let base = isGlobalView ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite);

    // Quarter filter
    if (!showAllHistory && selectedYear !== null && selectedQuarter !== null) {
      base = filterByQuarter(base, selectedYear, selectedQuarter);
    }

    // Site multi-filter for global view
    if (isGlobalView && siteFilter.length > 0) {
      base = base.filter(a => siteFilter.includes(a.siteName));
    }

    return base;
  }, [isGlobalView, selectedSite, selectedYear, selectedQuarter, showAllHistory, siteFilter]);

  const handleDownloadScorecard = (assessmentId: string) => {
    // Placeholder for download functionality
    const blob = new Blob([`Scorecard Report for ${assessmentId}\n\nThis is a placeholder report.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessmentId}-scorecard.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSiteFilter = (site: string) => {
    setSiteFilter(prev =>
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobalView ? 'All effluent risk assessments across sites' : `Assessments for ${selectedSite}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
          {!isGlobalView && (
            <Link to="/new-assessment">
              <Button size="sm" className="gap-1.5">
                New Assessment
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Site filter for global users */}
      {isGlobalView && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Filter by site:</span>
          {SITES.map(site => (
            <button
              key={site}
              onClick={() => toggleSiteFilter(site)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                siteFilter.includes(site)
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {site}
            </button>
          ))}
          {siteFilter.length > 0 && (
            <button onClick={() => setSiteFilter([])} className="text-xs text-muted-foreground hover:text-foreground underline">
              Clear
            </button>
          )}
        </div>
      )}

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
              {assessments.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">No assessments found</td></tr>
              )}
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
                      <div className="flex items-center gap-2">
                        <Link to={`/assessment/${a.id}`} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Open
                        </Link>
                        <button
                          onClick={() => handleDownloadScorecard(a.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          title="Download scorecard"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
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
