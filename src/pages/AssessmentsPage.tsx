import { mockAssessments, filterByQuarter, CURRENT_QUARTER, SUBSTANCE_CATEGORY_LABELS, ALL_PRODUCTS } from '@/data/mockData';
import { useSiteContext, SITES, SITE_METADATA, SITE_TYPE_LABELS } from '@/contexts/SiteContext';
import { StatusBadge, RiskBadge } from '@/components/StatusBadge';
import { QuarterSelector } from '@/components/QuarterSelector';
import { Link } from 'react-router-dom';
import { Building2, Clock, AlertTriangle, Download, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { SubstanceCategory } from '@/types/assessment';

const AssessmentsPage = () => {
  const { selectedSite, isGlobalView } = useSiteContext();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [siteFilter, setSiteFilter] = useState<string[]>([]);
  const [siteTypeFilter, setSiteTypeFilter] = useState<string>('');
  const [geoFilter, setGeoFilter] = useState<string>('');
  const [substanceFilter, setSubstanceFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const assessments = useMemo(() => {
    let base = isGlobalView ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite);

    if (!showAllHistory && selectedYear !== null && selectedQuarter !== null) {
      base = filterByQuarter(base, selectedYear, selectedQuarter);
    }

    if (isGlobalView && siteFilter.length > 0) {
      base = base.filter(a => siteFilter.includes(a.siteName));
    }

    if (isGlobalView && siteTypeFilter) {
      const sitesOfType = Object.values(SITE_METADATA).filter(m => m.type === siteTypeFilter).map(m => m.name);
      base = base.filter(a => sitesOfType.includes(a.siteName as any));
    }

    if (isGlobalView && geoFilter) {
      const sitesInGeo = Object.values(SITE_METADATA).filter(m => m.geoArea === geoFilter).map(m => m.name);
      base = base.filter(a => sitesInGeo.includes(a.siteName as any));
    }

    if (substanceFilter) {
      base = base.filter(a => a.substances.some(s => s.inn === substanceFilter));
    }

    if (categoryFilter) {
      base = base.filter(a => a.substances.some(s => s.category === categoryFilter));
    }

    return base;
  }, [isGlobalView, selectedSite, selectedYear, selectedQuarter, showAllHistory, siteFilter, siteTypeFilter, geoFilter, substanceFilter, categoryFilter]);

  const handleDownloadScorecard = (assessmentId: string) => {
    const blob = new Blob([`Scorecard Report for ${assessmentId}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessmentId}-scorecard.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSiteFilter = (site: string) => {
    setSiteFilter(prev => prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]);
  };

  const clearFilters = () => {
    setSiteFilter([]);
    setSiteTypeFilter('');
    setGeoFilter('');
    setSubstanceFilter('');
    setCategoryFilter('');
  };

  const hasFilters = siteFilter.length > 0 || siteTypeFilter || geoFilter || substanceFilter || categoryFilter;

  const allSubstances = [...new Set(ALL_PRODUCTS.map(p => p.name))];
  const allCategories = [...new Set(ALL_PRODUCTS.map(p => p.category))] as SubstanceCategory[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGlobalView ? 'All effluent risk assessments across sites' : `Assessments for ${selectedSite}`}
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
            if (!showAllHistory) { setSelectedYear(null); setSelectedQuarter(null); }
            else { setSelectedYear(CURRENT_QUARTER.year); setSelectedQuarter(CURRENT_QUARTER.quarter); }
          }}
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
          )}
        </div>

        {isGlobalView && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-12">Site:</span>
              {SITES.map(site => (
                <button key={site} onClick={() => toggleSiteFilter(site)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    siteFilter.includes(site)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}>
                  {site.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Type:</span>
                <select value={siteTypeFilter} onChange={e => setSiteTypeFilter(e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1 bg-background">
                  <option value="">All Types</option>
                  {Object.entries(SITE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Geo:</span>
                <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1 bg-background">
                  <option value="">All Regions</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Substance:</span>
            <select value={substanceFilter} onChange={e => setSubstanceFilter(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background max-w-[200px]">
              <option value="">All Substances</option>
              {allSubstances.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Category:</span>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background">
              <option value="">All Categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{SUBSTANCE_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
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
                <th>Modified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">No assessments found</td></tr>
              )}
              {assessments.map((a) => {
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
                    <td className="text-sm text-center">{a.revision}</td>
                    <td className="text-sm text-center">{a.substances.length}</td>
                    <td className="text-center">
                      {nc > 0 ? (
                        <span className="inline-flex items-center gap-1 text-danger text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />{nc}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
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
                        <button onClick={() => handleDownloadScorecard(a.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1" title="Download scorecard">
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
