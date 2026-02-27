import { useState } from 'react';
import { useSiteContext, SITES } from '@/contexts/SiteContext';
import { ALL_PRODUCTS } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import {
  Calendar,
  Users,
  FlaskConical,
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  Shield,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

// ── Mock campaigns ──
interface Campaign {
  id: string;
  quarter: string;
  year: number;
  status: 'open' | 'closed' | 'upcoming';
  submissionDeadline: string;
  reviewDeadline: string;
  sitesSubmitted: number;
  totalSites: number;
}

const initialCampaigns: Campaign[] = [
  { id: 'C-2025-Q1', quarter: 'Q1', year: 2025, status: 'open', submissionDeadline: '2025-03-31', reviewDeadline: '2025-04-15', sitesSubmitted: 3, totalSites: 4 },
  { id: 'C-2024-Q4', quarter: 'Q4', year: 2024, status: 'closed', submissionDeadline: '2024-12-31', reviewDeadline: '2025-01-15', sitesSubmitted: 4, totalSites: 4 },
  { id: 'C-2024-Q3', quarter: 'Q3', year: 2024, status: 'closed', submissionDeadline: '2024-09-30', reviewDeadline: '2024-10-15', sitesSubmitted: 3, totalSites: 4 },
  { id: 'C-2025-Q2', quarter: 'Q2', year: 2025, status: 'upcoming', submissionDeadline: '2025-06-30', reviewDeadline: '2025-07-15', sitesSubmitted: 0, totalSites: 4 },
];

// ── Mock user-site access ──
interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: 'site-user' | 'global-admin' | 'reviewer';
  sites: string[];
}

const initialUsers: UserAccess[] = [
  { id: 'u1', name: 'Dr. Elena Fischer', email: 'e.fischer@pharma.com', role: 'site-user', sites: ['Basel Manufacturing Site'] },
  { id: 'u2', name: "Sarah O'Brien", email: 's.obrien@pharma.com', role: 'site-user', sites: ['Dublin API Facility'] },
  { id: 'u3', name: 'Wei Lin Tan', email: 'w.tan@pharma.com', role: 'site-user', sites: ['Singapore Packaging Center'] },
  { id: 'u4', name: 'Dr. Thomas Braun', email: 't.braun@pharma.com', role: 'site-user', sites: ['Munich R&D Lab'] },
  { id: 'u5', name: 'Dr. Maria Schmidt', email: 'm.schmidt@pharma.com', role: 'global-admin', sites: [...SITES] },
  { id: 'u6', name: 'James Chen', email: 'j.chen@pharma.com', role: 'reviewer', sites: [...SITES] },
];

// ── Mock formula config ──
interface FormulaConfig {
  substanceName: string;
  casNumber: string;
  formulaType: 'standard' | 'custom';
  useStep2: boolean;
  customThreshold: number;
  notes: string;
}

const initialFormulas: FormulaConfig[] = ALL_PRODUCTS.map(p => ({
  substanceName: p.name,
  casNumber: p.casNumber,
  formulaType: 'standard' as const,
  useStep2: false,
  customThreshold: 1.0,
  notes: '',
}));

const AdminPanel = () => {
  const { isGlobalView } = useSiteContext();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [users, setUsers] = useState(initialUsers);
  const [formulas, setFormulas] = useState(initialFormulas);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  if (!isGlobalView) {
    return <Navigate to="/" replace />;
  }

  const handleCloseCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' as const } : c));
    toast({ title: 'Campaign Closed', description: `Campaign ${id} has been closed.` });
  };

  const handleOpenCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'open' as const } : c));
    toast({ title: 'Campaign Opened', description: `Campaign ${id} is now open for submissions.` });
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

  const handleFormulaChange = (index: number, field: keyof FormulaConfig, value: any) => {
    setFormulas(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const handleSaveFormulas = () => {
    toast({ title: 'Formulas Saved', description: 'Compliance formula configurations have been updated.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage data collection campaigns, user access, and compliance formulas
        </p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> User Access
          </TabsTrigger>
          <TabsTrigger value="formulas" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Formulas
          </TabsTrigger>
        </TabsList>

        {/* ── Campaigns ── */}
        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Collection Campaigns</h2>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(c => (
                <div key={c.id} className={`bg-card rounded-lg border shadow-sm overflow-hidden ${
                  c.status === 'open' ? 'border-primary/30' : 'border-border'
                }`}>
                  {c.status === 'open' && (
                    <div className="h-1 bg-primary" />
                  )}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{c.quarter} {c.year}</h3>
                        <p className="text-xs text-muted-foreground">{c.id}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        c.status === 'open' ? 'bg-success/10 text-success border border-success/20'
                        : c.status === 'upcoming' ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {c.status === 'open' ? 'Active' : c.status === 'upcoming' ? 'Upcoming' : 'Closed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Submission Deadline</Label>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.submissionDeadline}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Review Deadline</Label>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.reviewDeadline}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Submission Progress</span>
                        <span className="font-medium">{c.sitesSubmitted} / {c.totalSites} sites</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(c.sitesSubmitted / c.totalSites) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {c.status === 'open' && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCloseCampaign(c.id)}>
                          Close Campaign
                        </Button>
                      )}
                      {c.status === 'upcoming' && (
                        <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleOpenCampaign(c.id)}>
                          Open Campaign
                        </Button>
                      )}
                      {c.status === 'closed' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Campaign completed
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs ml-auto">
                        <Edit3 className="h-3 w-3" /> Edit Deadlines
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── User Access ── */}
        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User-Site Access Management</h2>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add User
              </Button>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Assigned Sites</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'global-admin' ? 'bg-primary/10 text-primary border border-primary/20'
                          : u.role === 'reviewer' ? 'bg-warning/10 text-warning border border-warning/20'
                          : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {u.role === 'global-admin' ? 'Global Admin' : u.role === 'reviewer' ? 'Reviewer' : 'Site User'}
                        </span>
                      </td>
                      <td>
                        {editingUser === u.id ? (
                          <div className="flex flex-wrap gap-1.5">
                            {SITES.map(site => (
                              <button
                                key={site}
                                onClick={() => handleToggleSite(u.id, site)}
                                className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                                  u.sites.includes(site)
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                                }`}
                              >
                                {site.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.sites.map(site => (
                              <span key={site} className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                {site.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                          >
                            {editingUser === u.id ? 'Done' : 'Edit'}
                          </Button>
                          {u.role !== 'global-admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleRemoveUser(u.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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
        </TabsContent>

        {/* ── Formulas ── */}
        <TabsContent value="formulas">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Compliance Formula Configuration</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure how PEC/PNEC compliance is calculated for each substance
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={handleSaveFormulas}>
                <Save className="h-3.5 w-3.5" /> Save All
              </Button>
            </div>

            <div className="space-y-3">
              {formulas.map((f, index) => (
                <div key={f.casNumber} className="bg-card rounded-lg border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">{f.substanceName}</h3>
                        <span className="text-xs text-muted-foreground font-mono">CAS {f.casNumber}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Formula Type</Label>
                          <Select
                            value={f.formulaType}
                            onValueChange={(v) => handleFormulaChange(index, 'formulaType', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="standard">Standard PEC/PNEC</SelectItem>
                              <SelectItem value="custom">Custom Threshold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Compliance Threshold</Label>
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={f.customThreshold}
                            onChange={(e) => handleFormulaChange(index, 'customThreshold', parseFloat(e.target.value) || 1.0)}
                          />
                        </div>

                        <div className="flex items-end gap-2 pb-0.5">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={f.useStep2}
                              onCheckedChange={(v) => handleFormulaChange(index, 'useStep2', v)}
                            />
                            <Label className="text-xs">Allow Step 2 Refinement</Label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Notes</Label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Optional notes..."
                            value={f.notes}
                            onChange={(e) => handleFormulaChange(index, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
