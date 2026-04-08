import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { mockAssessments } from '@/data/mockData';
import { getAuditTrail, getAuditFindings, AuditFinding } from '@/data/auditTrail';
import { useSiteContext } from '@/contexts/SiteContext';
import { StatusBadge, RiskBadge } from '@/components/StatusBadge';
import { getEditButtonText } from '@/types/assessment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Calendar, User, FileText, Shield,
  AlertTriangle, Recycle, Download, Edit3, CheckCircle2,
  Plus, Lock, Paperclip, ScanEye, Clock, MessageSquarePlus,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SEVERITY_COLORS: Record<AuditFinding['severity'], string> = {
  observation: 'bg-muted text-muted-foreground',
  minor: 'bg-amber-500/10 text-amber-700',
  major: 'bg-orange-500/10 text-orange-700',
  critical: 'bg-danger/10 text-danger',
};

const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isGlobalView, isAuditView, isSiteView } = useSiteContext();
  const assessment = mockAssessments.find((a) => a.id === id);

  const [showAuditTrail, setShowAuditTrail] = useState(true);
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [newFindingTitle, setNewFindingTitle] = useState('');
  const [newFindingDesc, setNewFindingDesc] = useState('');
  const [newFindingSeverity, setNewFindingSeverity] = useState<AuditFinding['severity']>('observation');
  const [localFindings, setLocalFindings] = useState<AuditFinding[]>([]);

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Assessment not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isCurrentQuarter = assessment.reportingPeriod.includes('2025');
  const editText = isSiteView && isCurrentQuarter ? getEditButtonText(assessment.status, assessment.reviewStarted) : null;
  const canApprove = isGlobalView && !isAuditView && assessment.status === 'pending-review';

  const generalAttachments = (assessment.attachments || []).filter(a => !a.substanceId);
  const getSubstanceAttachments = (subId: string) => (assessment.attachments || []).filter(a => a.substanceId === subId);

  const auditTrail = getAuditTrail(assessment.id);
  const auditFindings = [...getAuditFindings(assessment.id), ...localFindings.filter(f => f.assessmentId === assessment.id)];

  const handleApprove = () => {
    toast({ title: 'Assessment Approved', description: `${assessment.id} has been approved.` });
  };

  const handleDownload = (name: string) => {
    const blob = new Blob([`Mock content for ${name}`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([`Assessment Report\n\n${assessment.id}\n${assessment.siteName}\n${assessment.reportingPeriod}\n\nSubstances:\n${
      assessment.substances.map(s => `${s.inn} (CAS ${s.casNumber}) - PEC/PNEC: ${s.pecPnec?.toFixed(3) ?? 'N/A'} - ${s.complianceStatus}`).join('\n')
    }`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessment.id}-report.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: 'Assessment report has been downloaded.' });
  };

  const handleAddFinding = () => {
    if (!newFindingTitle.trim()) return;
    const finding: AuditFinding = {
      id: `af-local-${Date.now()}`,
      assessmentId: assessment.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      auditor: 'Current Auditor',
      severity: newFindingSeverity,
      title: newFindingTitle,
      description: newFindingDesc,
      status: 'open',
    };
    setLocalFindings(prev => [...prev, finding]);
    setNewFindingTitle('');
    setNewFindingDesc('');
    setShowAddFinding(false);
    toast({ title: 'Finding Added', description: 'Audit finding has been recorded.' });
  };

  const CATEGORY_ICONS: Record<string, string> = {
    status: '📋', edit: '✏️', approval: '✅', comment: '💬', attachment: '📎',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/assessments" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to Assessments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold">{assessment.siteName}</h1>
              <StatusBadge status={assessment.status} />
              {isAuditView && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full">
                  <ScanEye className="h-3 w-3" /> Audit Mode
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{assessment.operationalUnit}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isAuditView && editText && (
              <Link to="/data-entry">
                <Button variant={editText === 'Request Edit' ? 'outline' : 'default'} size="sm" className="gap-1.5">
                  {editText === 'Request Edit' ? <Lock className="h-3.5 w-3.5" /> :
                   editText === 'Enter Data' ? <Plus className="h-3.5 w-3.5" /> :
                   <Edit3 className="h-3.5 w-3.5" />}
                  {editText}
                </Button>
              </Link>
            )}
            {!isAuditView && canApprove && (
              <Button size="sm" className="gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPDF}>
              <Download className="h-3.5 w-3.5" /> Download Report
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{assessment.id} · Rev {assessment.revision}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{assessment.reportingPeriod}</span>
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Owner: {assessment.owner}</span>
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />HSEO: {assessment.siteHSEO}</span>
          {(isGlobalView || isAuditView) && (
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
              Formula {assessment.formulaVersion} · Calc {assessment.calculationVersion}
            </span>
          )}
        </div>
      </div>

      {/* Exempt flag */}
      {assessment.exempt && (
        <div className="p-4 rounded-lg bg-muted border border-border">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Exempt Assessment</p>
              <p className="text-xs text-muted-foreground mt-0.5">{assessment.exemptJustification}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reuse flags */}
      {(assessment.reuseWastewater || assessment.reuseSludge) && (
        <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-2">
            <Recycle className="h-4 w-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium">Special Reuse Flags</p>
              {assessment.reuseWastewater && <p className="text-xs text-muted-foreground">• Treated wastewater reused for irrigation</p>}
              {assessment.reuseSludge && <p className="text-xs text-muted-foreground">• Sludge/biomass reused for land application</p>}
            </div>
          </div>
        </div>
      )}

      {/* General Attachments */}
      {generalAttachments.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Site-Level Attachments</h3>
          </div>
          <div className="divide-y divide-border/50">
            {generalAttachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{att.name}</p>
                    <p className="text-xs text-muted-foreground">{att.size} · Uploaded {att.uploadedDate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => handleDownload(att.name)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Substance Table */}
      {!assessment.exempt && assessment.substances.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold">Substance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Substance</th>
                  <th>CAS</th>
                  <th>Category</th>
                  <th>Processed (kg/yr)</th>
                  <th>Load to WW (kg/yr)</th>
                  <th>PEC/PNEC</th>
                  <th>MEC/PNEC</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {assessment.substances.map(s => {
                  const subAttachments = getSubstanceAttachments(s.id);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{s.inn}</p>
                          {s.riskComment && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px] truncate">{s.riskComment}</p>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs">{s.casNumber}</td>
                      <td className="text-xs capitalize">{s.category?.replace('-', ' ') ?? '—'}</td>
                      <td className="font-mono text-sm">{s.annualProcessed?.toLocaleString() ?? '—'}</td>
                      <td className="font-mono text-sm">{s.annualLoadToWastewater?.toFixed(1) ?? '—'}</td>
                      <td className={`font-mono text-sm font-bold ${(s.pecPnec ?? 0) >= 1 ? 'text-danger' : 'text-success'}`}>
                        {s.pecPnec?.toFixed(3) ?? '—'}
                      </td>
                      <td className={`font-mono text-sm font-bold ${(s.mecPnec ?? 0) >= 1 ? 'text-danger' : s.mecPnec != null ? 'text-success' : ''}`}>
                        {s.mecPnec != null ? s.mecPnec.toFixed(3) : '—'}
                      </td>
                      <td>{s.riskZone && <RiskBadge zone={s.riskZone} />}</td>
                      <td>
                        <span className={`text-xs font-medium ${s.complianceStatus === 'compliant' ? 'text-success' : s.complianceStatus === 'non-compliant' ? 'text-danger' : 'text-muted-foreground'}`}>
                          {s.complianceStatus === 'compliant' ? '✓ Pass' : s.complianceStatus === 'non-compliant' ? '✗ Fail' : s.complianceStatus === 'exempt' ? 'Exempt' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {subAttachments.length > 0 ? (
                          <div className="space-y-1">
                            {subAttachments.map((att, i) => (
                              <button key={i} onClick={() => handleDownload(att.name)}
                                className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <Download className="h-3 w-3" />
                                <span className="max-w-[120px] truncate">{att.name}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comments */}
      {assessment.comments && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold mb-2">Comments</h3>
          <p className="text-sm text-muted-foreground">{assessment.comments}</p>
        </div>
      )}

      {/* Audit Trail — visible to all, prominent for auditors */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAuditTrail(!showAuditTrail)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Audit Trail</h3>
            <span className="text-xs text-muted-foreground">({auditTrail.length} events)</span>
          </div>
          {showAuditTrail ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showAuditTrail && (
          <div className="border-t border-border">
            {auditTrail.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">No audit trail events recorded.</p>
            ) : (
              <div className="relative px-5 py-4">
                <div className="absolute left-[39px] top-4 bottom-4 w-px bg-border" />
                <div className="space-y-4">
                  {auditTrail.map((event) => (
                    <div key={event.id} className="flex gap-3 relative">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs z-10">
                        {CATEGORY_ICONS[event.category] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="text-sm font-medium">{event.action}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">{event.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.details}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">by {event.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Findings — visible to all, editable by auditors */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <ScanEye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Audit Findings</h3>
            <span className="text-xs text-muted-foreground">({auditFindings.length})</span>
          </div>
          {isAuditView && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAddFinding(!showAddFinding)}>
              <MessageSquarePlus className="h-3.5 w-3.5" /> Add Finding
            </Button>
          )}
        </div>

        {/* Add finding form */}
        {isAuditView && showAddFinding && (
          <div className="px-5 py-4 border-b border-border bg-muted/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <Input value={newFindingTitle} onChange={e => setNewFindingTitle(e.target.value)} placeholder="Finding title..." className="text-sm h-8" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                <Select value={newFindingSeverity} onValueChange={(v) => setNewFindingSeverity(v as AuditFinding['severity'])}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={newFindingDesc} onChange={e => setNewFindingDesc(e.target.value)} placeholder="Describe the finding..." className="text-sm min-h-[60px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddFinding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddFinding} disabled={!newFindingTitle.trim()}>Submit Finding</Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border/50">
          {auditFindings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No audit findings recorded.</p>
          ) : (
            auditFindings.map(f => (
              <div key={f.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded', SEVERITY_COLORS[f.severity])}>
                        {f.severity}
                      </span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded',
                        f.status === 'open' ? 'bg-danger/10 text-danger' :
                        f.status === 'acknowledged' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      )}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">by {f.auditor} · {f.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
