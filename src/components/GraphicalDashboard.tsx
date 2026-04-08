import { useMemo, useState } from 'react';
import { mockAssessments, filterByQuarter, CURRENT_QUARTER, AVAILABLE_QUARTERS, SUBSTANCE_CATEGORY_LABELS, ALL_PRODUCTS } from '@/data/mockData';
import { useSiteContext, SITES, SITE_METADATA, SITE_TYPE_LABELS } from '@/contexts/SiteContext';
import { getRiskZone, RISK_ZONE_COLORS, RISK_ZONE_LABELS, RiskZone, SubstanceCategory } from '@/types/assessment';
import { QuarterSelector } from '@/components/QuarterSelector';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GraphicalDashboardProps {
  selectedYear: number | null;
  selectedQuarter: number | null;
  showAllHistory: boolean;
  onYearChange: (y: number | null) => void;
  onQuarterChange: (q: number | null) => void;
  onToggleAllHistory: () => void;
}

export function GraphicalDashboard({
  selectedYear, selectedQuarter, showAllHistory,
  onYearChange, onQuarterChange, onToggleAllHistory,
}: GraphicalDashboardProps) {
  const { selectedSite, isGlobalView, isAuditView } = useSiteContext();
  const showAll = isGlobalView || isAuditView;
  const [siteFilter, setSiteFilter] = useState<string[]>([]);
  const [siteTypeFilter, setSiteTypeFilter] = useState('');
  const [geoFilter, setGeoFilter] = useState('');

  const assessments = useMemo(() => {
    let base = showAll ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite);
    if (!showAllHistory && selectedYear !== null && selectedQuarter !== null) {
      base = filterByQuarter(base, selectedYear, selectedQuarter);
    }
    if (showAll && siteFilter.length > 0) base = base.filter(a => siteFilter.includes(a.siteName));
    if (showAll && siteTypeFilter) {
      const sites = Object.values(SITE_METADATA).filter(m => m.type === siteTypeFilter).map(m => m.name);
      base = base.filter(a => sites.includes(a.siteName as any));
    }
    if (showAll && geoFilter) {
      const sites = Object.values(SITE_METADATA).filter(m => m.geoArea === geoFilter).map(m => m.name);
      base = base.filter(a => sites.includes(a.siteName as any));
    }
    return base;
  }, [isGlobalView, selectedSite, selectedYear, selectedQuarter, showAllHistory, siteFilter, siteTypeFilter, geoFilter]);

  const allSubstances = assessments.flatMap(a => a.substances);

  // 1. Pie: substances by risk zone
  const riskDistribution = useMemo(() => {
    const counts: Record<RiskZone, number> = { compliant: 0, low: 0, medium: 0, high: 0 };
    allSubstances.forEach(s => { const rz = s.riskZone || getRiskZone(s.pecPnec); counts[rz]++; });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([k, v]) => ({
      name: RISK_ZONE_LABELS[k as RiskZone], value: v, color: RISK_ZONE_COLORS[k as RiskZone],
    }));
  }, [allSubstances]);

  // 2. Bar: non-compliant by site
  const ncBySite = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    assessments.forEach(a => {
      a.substances.forEach(s => {
        const rz = s.riskZone || getRiskZone(s.pecPnec);
        if (rz === 'compliant') return;
        if (!map[a.siteName]) map[a.siteName] = { low: 0, medium: 0, high: 0 };
        map[a.siteName][rz]++;
      });
    });
    return Object.entries(map).map(([site, counts]) => ({
      site: site.split(' ')[0], ...counts,
    }));
  }, [assessments]);

  // 3. Line: risk zones over time
  const riskOverTime = useMemo(() => {
    return [...AVAILABLE_QUARTERS].reverse().map(q => {
      const qAssessments = filterByQuarter(
        showAll ? mockAssessments : mockAssessments.filter(a => a.siteName === selectedSite),
        q.year, q.quarter
      );
      const subs = qAssessments.flatMap(a => a.substances);
      const counts = { label: q.label, low: 0, medium: 0, high: 0 };
      subs.forEach(s => {
        const rz = s.riskZone || getRiskZone(s.pecPnec);
        if (rz === 'low') counts.low++;
        if (rz === 'medium') counts.medium++;
        if (rz === 'high') counts.high++;
      });
      return counts;
    });
  }, [isGlobalView, selectedSite]);

  // 4. Pie: most non-compliant substances
  const ncBySubstance = useMemo(() => {
    const map: Record<string, number> = {};
    allSubstances.filter(s => (s.riskZone || getRiskZone(s.pecPnec)) !== 'compliant').forEach(s => {
      map[s.inn] = (map[s.inn] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({
      name, value, color: `hsl(${(i * 45) % 360}, 65%, 50%)`,
    }));
  }, [allSubstances]);

  // 5. Pie: non-compliance by site
  const ncBySitePie = useMemo(() => {
    const map: Record<string, number> = {};
    assessments.forEach(a => {
      const nc = a.substances.filter(s => (s.riskZone || getRiskZone(s.pecPnec)) !== 'compliant').length;
      if (nc > 0) map[a.siteName] = (map[a.siteName] || 0) + nc;
    });
    return Object.entries(map).map(([name, value], i) => ({
      name: name.split(' ')[0], value, color: `hsl(${200 + i * 60}, 55%, 45%)`,
    }));
  }, [assessments]);

  // 6. Pie: non-compliance by category
  const ncByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allSubstances.filter(s => (s.riskZone || getRiskZone(s.pecPnec)) !== 'compliant').forEach(s => {
      const label = SUBSTANCE_CATEGORY_LABELS[s.category] || s.category;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({
      name, value, color: `hsl(${(i * 50 + 10) % 360}, 60%, 48%)`,
    }));
  }, [allSubstances]);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters for global */}
      {showAll && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Filters:</span>
            {SITES.map(site => (
              <button key={site} onClick={() => setSiteFilter(prev => prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site])}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  siteFilter.includes(site) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                }`}>
                {site.split(' ')[0]}
              </button>
            ))}
            <select value={siteTypeFilter} onChange={e => setSiteTypeFilter(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background">
              <option value="">All Types</option>
              {Object.entries(SITE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background">
              <option value="">All Regions</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Risk Distribution Pie */}
        <ChartCard title="Substance Risk Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderLabel}>
                {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. NC by Site Bar */}
        <ChartCard title="Non-Compliant Substances by Site">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ncBySite}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="site" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="low" name="Low Risk" fill={RISK_ZONE_COLORS.low} stackId="a" />
              <Bar dataKey="medium" name="Medium Risk" fill={RISK_ZONE_COLORS.medium} stackId="a" />
              <Bar dataKey="high" name="High Risk" fill={RISK_ZONE_COLORS.high} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Risk Over Time Line */}
        <ChartCard title="Risk Zones Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={riskOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="low" name="Low Risk" stroke={RISK_ZONE_COLORS.low} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="medium" name="Medium Risk" stroke={RISK_ZONE_COLORS.medium} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="high" name="High Risk" stroke={RISK_ZONE_COLORS.high} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Most NC Substances Pie */}
        <ChartCard title="Most Non-Compliant Substances">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ncBySubstance} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderLabel}>
                {ncBySubstance.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. NC by Site Pie */}
        <ChartCard title="Non-Compliance Share by Site">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ncBySitePie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderLabel}>
                {ncBySitePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. NC by Category Pie */}
        <ChartCard title="Non-Compliance by Substance Category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ncByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderLabel}>
                {ncByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
