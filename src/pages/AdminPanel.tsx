import { useState } from 'react';
import { useSiteContext, SITES, SiteName } from '@/contexts/SiteContext';
import { ALL_PRODUCTS, AVAILABLE_QUARTERS } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Calendar, Users, FlaskConical, Settings, Plus, Trash2,
  Save, CheckCircle2, Clock, Building2, Shield, Edit3,
  AlertTriangle, RotateCcw, X, Calculator, Gauge,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';

// ── Campaign types ──
interface Campaign {
  id: string;
  quarter: string;
  year: number;
  status: 'open' | 'closed' | 'upcoming';
  submissionDeadline: string;
  reviewDeadline: string;
  sitesSubmitted: number;
  totalSites: number;
  formulaVersion: string;
  calculationVersion: string;
}

const initialCampaigns: Campaign[] = [
  { id: 'C-2025-Q1', quarter: 'Q1', year: 2025, status: 'open', submissionDeadline: '2025-03-31', reviewDeadline: '2025-04-15', sitesSubmitted: 3, totalSites: 4, formulaVersion: 'v2.1', calculationVersion: 'v2.1' },
  { id: 'C-2024-Q4', quarter: 'Q4', year: 2024, status: 'closed', submissionDeadline: '2024-12-31', reviewDeadline: '2025-01-15', sitesSubmitted: 4, totalSites: 4, formulaVersion: 'v2.0', calculationVersion: 'v2.0' },
  { id: 'C-2024-Q3', quarter: 'Q3', year: 2024, status: 'closed', submissionDeadline: '2024-09-30', reviewDeadline: '2024-10-15', sitesSubmitted: 4, totalSites: 4, formulaVersion: 'v1.5', calculationVersion: 'v1.5' },
  { id: 'C-2025-Q2', quarter: 'Q2', year: 2025, status: 'upcoming', submissionDeadline: '2025-06-30', reviewDeadline: '2025-07-15', sitesSubmitted: 0, totalSites: 4, formulaVersion: 'v2.1', calculationVersion: 'v2.1' },
];

interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: 'site-head' | 'reviewer' | 'central-admin';
  sites: string[];
}

const initialUsers: UserAccess[] = [
  { id: 'u1', name: 'Dr. Elena Fischer', email: 'e.fischer@pharma.com', role: 'site-head', sites: ['Basel Manufacturing Site'] },
  { id: 'u2', name: "Sarah O'Brien", email: 's.obrien@pharma.com', role: 'site-head', sites: ['Dublin API Facility'] },
  { id: 'u3', name: 'Wei Lin Tan', email: 'w.tan@pharma.com', role: 'site-head', sites: ['Singapore Packaging Center'] },
  { id: 'u4', name: 'Dr. Thomas Braun', email: 't.braun@pharma.com', role: 'site-head', sites: ['Munich R&D Lab'] },
  { id: 'u5', name: 'Dr. Maria Schmidt', email: 'm.schmidt@pharma.com', role: 'central-admin', sites: [] },
  { id: 'u6', name: 'James Chen', email: 'j.chen@pharma.com', role: 'reviewer', sites: [] },
  { id: 'u7', name: 'Dr. Anna Park', email: 'a.park@pharma.com', role: 'reviewer', sites: [] },
];

// ── Formula types ──
interface FormulaConfig {
  substanceName: string;
  casNumber: string;
  formulaType: 'standard' | 'custom';
  useStep2: boolean;
  customThreshold: number;
  notes: string;
}

interface AnnualFormulaConfig {
  substanceName: string;
  casNumber: string;
  formulaType: 'standard' | 'custom';
  divisor: number; // 365
  useStep2: boolean;
  customThreshold: number;
  notes: string;
}

interface WeeklyFormulaConfig {
  substanceName: string;
  casNumber: string;
  formulaType: 'standard' | 'custom';
  divisor: number; // 7
  useStep2: boolean;
  customThreshold: number;
  notes: string;
}

interface ThresholdConfig {
  substanceName: string;
  casNumber: string;
  lowThreshold: number;
  mediumThreshold: number;
  highThreshold: number;
}

const CURRENT_FORMULA_VERSION = 'v2.1';

const initialAnnualFormulas: AnnualFormulaConfig[] = ALL_PRODUCTS.map(p => ({
  substanceName: p.name, casNumber: p.casNumber,
  formulaType: 'standard' as const, divisor: 365, useStep2: false, customThreshold: 1.0, notes: '',
}));

const initialWeeklyFormulas: WeeklyFormulaConfig[] = ALL_PRODUCTS.map(p => ({
  substanceName: p.name, casNumber: p.casNumber,
  formulaType: 'standard' as const, divisor: 7, useStep2: false, customThreshold: 1.0, notes: '',
}));

const initialThresholds: ThresholdConfig[] = ALL_PRODUCTS.map(p => ({
  substanceName: p.name, casNumber: p.casNumber,
  lowThreshold: 0.1, mediumThreshold: 0.5, highThreshold: 1.0,
}));

const AdminPanel = () => {
  const { isGlobalView } = useSiteContext();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [users, setUsers] = useState(initialUsers);
  const [annualFormulas, setAnnualFormulas] = useState(initialAnnualFormulas);
  const [weeklyFormulas, setWeeklyFormulas] = useState(initialWeeklyFormulas);
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [editDeadlineId, setEditDeadlineId] = useState<string | null>(null);
  const [editDeadlineValues, setEditDeadlineValues] = useState({ submission: '', review: '' });

  if (!isGlobalView) return <Navigate to="/" replace />;

  const activeCampaign = campaigns.find(c => c.status === 'open');
  const otherCampaigns = campaigns.filter(c => c.id !== activeCampaign?.id);

  const siteHeads = users.filter(u => u.role === 'site-head');
  const reviewers = users.filter(u => u.role === 'reviewer');
  const admins = users.filter(u => u.role === 'central-admin');

  const handleCloseCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' as const } : c));
    toast({ title: 'Campaign Closed', description: `Campaign ${id} closed.` });
  };

  const handleReopenCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'open' as const } : c));
    toast({ title: 'Campaign Re-opened', description: `Campaign ${id} is now open.` });
  };

  const handleOpenCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'open' as const } : c));
    toast({ title: 'Campaign Opened' });
  };

  const startEditDeadline = (c: Campaign) => {
    setEditDeadlineId(c.id);
    setEditDeadlineValues({ submission: c.submissionDeadline, review: c.reviewDeadline });
  };

  const saveDeadline = () => {
    if (!editDeadlineId) return;
    setCampaigns(prev => prev.map(c =>
      c.id === editDeadlineId ? { ...c, submissionDeadline: editDeadlineValues.submission, reviewDeadline: editDeadlineValues.review } : c
    ));
    setEditDeadlineId(null);
    toast({ title: 'Deadlines Updated' });
  };

  const handleRemoveUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({ title: 'User Removed' });
  };

  const handleToggleSite = (userId: string, site: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const sites = u.sites.includes(site) ? u.sites.filter(s => s !== site) : [...u.sites, site];
      return { ...u, sites };
    }));
  };

  const handleAnnualFormulaChange = (index: number, field: keyof AnnualFormulaConfig, value: any) => {
    setAnnualFormulas(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const handleWeeklyFormulaChange = (index: number, field: keyof WeeklyFormulaConfig, value: any) => {
    setWeeklyFormulas(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const handleThresholdChange = (index: number, field: keyof ThresholdConfig, value: any) => {
    setThresholds(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleSaveFormulas = () => {
    toast({ title: 'Formulas Saved', description: `New version created. Current: ${CURRENT_FORMULA_VERSION}` });
  };

  const handleSaveThresholds = () => {
    toast({ title: 'Thresholds Saved', description: `New version created. Current: ${CURRENT_FORMULA_VERSION}` });
  };

  const handleCreateCampaign = (quarter: string, year: number, subDeadline: string, revDeadline: string) => {
    const newCampaign: Campaign = {
      id: `C-${year}-${quarter}`, quarter, year, status: 'upcoming',
      submissionDeadline: subDeadline, reviewDeadline: revDeadline,
      sitesSubmitted: 0, totalSites: 4,
      formulaVersion: CURRENT_FORMULA_VERSION, calculationVersion: CURRENT_FORMULA_VERSION,
    };
    setCampaigns(prev => [...prev, newCampaign]);
    setNewCampaignOpen(false);
    toast({ title: 'Campaign Created', description: `${quarter} ${year} campaign created.` });
  };

  const handleChangeCampaignVersion = (campaignId: string, version: string) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, formulaVersion: version, calculationVersion: version } : c));
    toast({ title: 'Version Updated' });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage campaigns, user access, and compliance configurations</p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="campaigns" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" /> User Access</TabsTrigger>
          <TabsTrigger value="formulas" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Formulas</TabsTrigger>
        </TabsList>

        {/* ── Campaigns ── */}
        <TabsContent value="campaigns">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Collection Campaigns</h2>
              <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New Campaign</Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <NewCampaignForm onCreate={handleCreateCampaign} onCancel={() => setNewCampaignOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {activeCampaign && (
              <div className="bg-card rounded-xl border-2 border-primary/30 shadow-md overflow-hidden">
                <div className="h-1.5 bg-primary" />
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{activeCampaign.quarter} {activeCampaign.year}</h3>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activeCampaign.id}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCloseCampaign(activeCampaign.id)}>
                      Close Campaign
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <InfoBlock label="Submission Deadline" value={activeCampaign.submissionDeadline} icon={<Clock className="h-3.5 w-3.5" />} />
                    <InfoBlock label="Review Deadline" value={activeCampaign.reviewDeadline} icon={<Clock className="h-3.5 w-3.5" />} />
                    <InfoBlock label="Formula Version" value={activeCampaign.formulaVersion} icon={<FlaskConical className="h-3.5 w-3.5" />} />
                    <InfoBlock label="Progress" value={`${activeCampaign.sitesSubmitted} / ${activeCampaign.totalSites} sites`} icon={<Building2 className="h-3.5 w-3.5" />} />
                  </div>

                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(activeCampaign.sitesSubmitted / activeCampaign.totalSites) * 100}%` }} />
                  </div>

                  <div className="flex items-center gap-2">
                    {editDeadlineId === activeCampaign.id ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="space-y-1">
                          <Label className="text-xs">Submission</Label>
                          <Input type="date" className="h-8 text-xs w-[150px]" value={editDeadlineValues.submission}
                            onChange={e => setEditDeadlineValues(p => ({ ...p, submission: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Review</Label>
                          <Input type="date" className="h-8 text-xs w-[150px]" value={editDeadlineValues.review}
                            onChange={e => setEditDeadlineValues(p => ({ ...p, review: e.target.value }))} />
                        </div>
                        <Button size="sm" className="h-8 text-xs mt-5" onClick={saveDeadline}>Save</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs mt-5" onClick={() => setEditDeadlineId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => startEditDeadline(activeCampaign)}>
                        <Edit3 className="h-3 w-3" /> Edit Deadlines
                      </Button>
                    )}

                    <Select value={activeCampaign.formulaVersion} onValueChange={v => handleChangeCampaignVersion(activeCampaign.id, v)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="v1.0">v1.0</SelectItem>
                        <SelectItem value="v1.5">v1.5</SelectItem>
                        <SelectItem value="v2.0">v2.0</SelectItem>
                        <SelectItem value="v2.1">v2.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {otherCampaigns.length > 0 && (
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">Other Campaigns</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Campaign</th><th>Status</th><th>Submission</th><th>Review</th><th>Progress</th><th>Version</th><th></th></tr>
                    </thead>
                    <tbody>
                      {otherCampaigns.map(c => (
                        <tr key={c.id}>
                          <td className="font-medium text-sm">{c.quarter} {c.year} <span className="text-xs text-muted-foreground ml-1">{c.id}</span></td>
                          <td>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              c.status === 'upcoming' ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-muted text-muted-foreground border border-border'
                            }`}>{c.status === 'upcoming' ? 'Upcoming' : 'Closed'}</span>
                          </td>
                          <td className="text-sm">{c.submissionDeadline}</td>
                          <td className="text-sm">{c.reviewDeadline}</td>
                          <td className="text-sm">{c.sitesSubmitted}/{c.totalSites}</td>
                          <td>
                            <Select value={c.formulaVersion} onValueChange={v => handleChangeCampaignVersion(c.id, v)}>
                              <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                <SelectItem value="v1.0">v1.0</SelectItem>
                                <SelectItem value="v1.5">v1.5</SelectItem>
                                <SelectItem value="v2.0">v2.0</SelectItem>
                                <SelectItem value="v2.1">v2.1</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {c.status === 'upcoming' && (
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleOpenCampaign(c.id)}>Open</Button>
                              )}
                              {c.status === 'closed' && (
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleReopenCampaign(c.id)}>
                                  <RotateCcw className="h-3 w-3" /> Re-open
                                </Button>
                              )}
                              {editDeadlineId === c.id ? (
                                <div className="flex items-center gap-2">
                                  <Input type="date" className="h-7 text-xs w-[130px]" value={editDeadlineValues.submission}
                                    onChange={e => setEditDeadlineValues(p => ({ ...p, submission: e.target.value }))} />
                                  <Input type="date" className="h-7 text-xs w-[130px]" value={editDeadlineValues.review}
                                    onChange={e => setEditDeadlineValues(p => ({ ...p, review: e.target.value }))} />
                                  <Button size="sm" className="h-7 text-xs" onClick={saveDeadline}>Save</Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditDeadlineId(null)}><X className="h-3 w-3" /></Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEditDeadline(c)}>
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── User Access ── */}
        <TabsContent value="users">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Access Management</h2>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add User</Button>
            </div>

            <UserSection title="Central Administrators" subtitle="Full platform access — no site assignment needed" icon={<Shield className="h-4 w-4 text-primary" />}
              users={admins} onRemove={handleRemoveUser} editingUser={editingUser} setEditingUser={setEditingUser} onToggleSite={handleToggleSite} showSites={false} />
            <UserSection title="Reviewers" subtitle="Global review access — no site assignment needed" icon={<CheckCircle2 className="h-4 w-4 text-warning" />}
              users={reviewers} onRemove={handleRemoveUser} editingUser={editingUser} setEditingUser={setEditingUser} onToggleSite={handleToggleSite} showSites={false} />
            <UserSection title="Site Heads" subtitle="Assigned to specific sites for data entry and management" icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              users={siteHeads} onRemove={handleRemoveUser} editingUser={editingUser} setEditingUser={setEditingUser} onToggleSite={handleToggleSite} showSites={true} />
          </div>
        </TabsContent>

        {/* ── Formulas ── */}
        <TabsContent value="formulas">
          <Tabs defaultValue="calculations">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="calculations" className="gap-1.5"><Calculator className="h-3.5 w-3.5" /> Calculations</TabsTrigger>
                <TabsTrigger value="thresholds" className="gap-1.5"><Gauge className="h-3.5 w-3.5" /> Thresholds</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Version:</span>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{CURRENT_FORMULA_VERSION}</span>
              </div>
            </div>

            <TabsContent value="calculations">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Calculation Formulas</h2>
                    <p className="text-xs text-muted-foreground">Configure PEC/PNEC calculation logic per substance. Changes create a new version.</p>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={handleSaveFormulas}><Save className="h-3.5 w-3.5" /> Save & Version</Button>
                </div>

                {/* Annual Average */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Annual Average Formulas
                    <span className="text-xs text-muted-foreground font-normal">(Divisor: 365 days)</span>
                  </h3>
                  {annualFormulas.map((f, index) => (
                    <FormulaCard key={f.casNumber} formula={f} index={index}
                      onChange={(idx, field, val) => handleAnnualFormulaChange(idx, field as any, val)} />
                  ))}
                </div>

                {/* Weekly Average */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Weekly Average Formulas
                    <span className="text-xs text-muted-foreground font-normal">(Divisor: 7 days)</span>
                  </h3>
                  {weeklyFormulas.map((f, index) => (
                    <FormulaCard key={f.casNumber} formula={f} index={index}
                      onChange={(idx, field, val) => handleWeeklyFormulaChange(idx, field as any, val)} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="thresholds">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Risk Thresholds</h2>
                    <p className="text-xs text-muted-foreground">Set PEC/PNEC thresholds for low, medium, and high risk per substance. Changes create a new version.</p>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={handleSaveThresholds}><Save className="h-3.5 w-3.5" /> Save & Version</Button>
                </div>

                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Substance</th>
                          <th>CAS</th>
                          <th>Low Risk (&lt;)</th>
                          <th>Medium Risk (&lt;)</th>
                          <th>High Risk (≥)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {thresholds.map((t, index) => (
                          <tr key={t.casNumber}>
                            <td className="font-medium text-sm">{t.substanceName}</td>
                            <td className="font-mono text-xs">{t.casNumber}</td>
                            <td>
                              <Input type="number" step="0.01" className="h-7 text-xs w-[80px]" value={t.lowThreshold}
                                onChange={e => handleThresholdChange(index, 'lowThreshold', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td>
                              <Input type="number" step="0.01" className="h-7 text-xs w-[80px]" value={t.mediumThreshold}
                                onChange={e => handleThresholdChange(index, 'mediumThreshold', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td>
                              <Input type="number" step="0.01" className="h-7 text-xs w-[80px]" value={t.highThreshold}
                                onChange={e => handleThresholdChange(index, 'highThreshold', parseFloat(e.target.value) || 0)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ── Sub-components ──

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5 text-sm font-medium">{icon}{value}</div>
    </div>
  );
}

function FormulaCard({ formula, index, onChange }: {
  formula: { substanceName: string; casNumber: string; formulaType: string; useStep2: boolean; customThreshold: number; notes: string };
  index: number;
  onChange: (index: number, field: string, value: any) => void;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{formula.substanceName}</h3>
        <span className="text-xs text-muted-foreground font-mono">CAS {formula.casNumber}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Formula Type</Label>
          <Select value={formula.formulaType} onValueChange={v => onChange(index, 'formulaType', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="standard">Standard PEC/PNEC</SelectItem>
              <SelectItem value="custom">Custom Threshold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Compliance Threshold</Label>
          <Input type="number" step="0.1" className="h-8 text-xs" value={formula.customThreshold}
            onChange={e => onChange(index, 'customThreshold', parseFloat(e.target.value) || 1.0)} />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <Switch checked={formula.useStep2} onCheckedChange={v => onChange(index, 'useStep2', v)} />
          <Label className="text-xs">Step 2 Refinement</Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Input className="h-8 text-xs" placeholder="Optional..." value={formula.notes}
            onChange={e => onChange(index, 'notes', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function UserSection({ title, subtitle, icon, users, onRemove, editingUser, setEditingUser, onToggleSite, showSites }: {
  title: string; subtitle: string; icon: React.ReactNode;
  users: UserAccess[]; onRemove: (id: string) => void;
  editingUser: string | null; setEditingUser: (id: string | null) => void;
  onToggleSite: (userId: string, site: string) => void; showSites: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {showSites && (
                editingUser === u.id ? (
                  <div className="flex flex-wrap gap-1.5">
                    {SITES.map(site => (
                      <button key={site} onClick={() => onToggleSite(u.id, site)}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          u.sites.includes(site) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                        }`}>{site.split(' ')[0]}</button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {u.sites.map(site => (
                      <span key={site} className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{site.split(' ')[0]}</span>
                    ))}
                  </div>
                )
              )}
              <div className="flex items-center gap-1.5">
                {showSites && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs"
                    onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}>
                    {editingUser === u.id ? 'Done' : 'Edit'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => onRemove(u.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">No users in this role</div>
        )}
      </div>
    </div>
  );
}

function NewCampaignForm({ onCreate, onCancel }: { onCreate: (q: string, y: number, sub: string, rev: string) => void; onCancel: () => void }) {
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(2025);
  const [subDeadline, setSubDeadline] = useState('');
  const [revDeadline, setRevDeadline] = useState('');

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Campaign</DialogTitle>
        <DialogDescription>Create a new data collection campaign</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {['Q1','Q2','Q3','Q4'].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Year</Label>
            <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Submission Deadline</Label>
          <Input type="date" value={subDeadline} onChange={e => setSubDeadline(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Review Deadline</Label>
          <Input type="date" value={revDeadline} onChange={e => setRevDeadline(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onCreate(quarter, year, subDeadline, revDeadline)} disabled={!subDeadline || !revDeadline}>Create</Button>
      </DialogFooter>
    </>
  );
}

export default AdminPanel;
