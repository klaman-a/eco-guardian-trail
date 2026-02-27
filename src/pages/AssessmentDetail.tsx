import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { mockAssessments, defaultChecklist } from '@/data/mockData';
import { useSiteContext } from '@/contexts/SiteContext';
import { StatusBadge } from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubstanceTable } from '@/components/SubstanceTable';
import { SiteSummary } from '@/components/SiteSummary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChecklistItem } from '@/types/assessment';
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  FileText,
  Shield,
  AlertTriangle,
  Droplets,
  Recycle,
  Download,
  Edit3,
  CheckCircle2,
  Paperclip,
  ClipboardList,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isGlobalView } = useSiteContext();
  const assessment = mockAssessments.find((a) => a.id === id);

  // Auto-populating checklist based on assessment state
  const autoChecklist = useMemo(() => {
    if (!assessment) return defaultChecklist;
    const items = defaultChecklist.map(item => {
      let completed = false;
      switch (item.id) {
        case 'c1': completed = assessment.substances.length > 0 || assessment.exempt; break;
        case 'c2': completed = assessment.substances.every(s => s.pnecValue !== null && s.pnecValue > 0); break;
        case 'c3': completed = assessment.substances.every(s => s.batchesPerYear > 0); break;
        case 'c4': completed = assessment.substances.every(s => (s.wastewaterFlow ?? 0) > 0); break;
        case 'c5': completed = assessment.substances.every(s => (s.dilutionFactor ?? 0) > 0); break;
        case 'c6': completed = (assessment.attachments?.length ?? 0) > 0; break;
        case 'c7': {
          const ncSubs = assessment.substances.filter(s => s.complianceStatus === 'non-compliant');
          completed = ncSubs.length === 0 || assessment.status === 'approved';
          break;
        }
        case 'c8': completed = !!assessment.owner && !!assessment.siteHSEO; break;
        case 'c9': completed = true; break;
        case 'c10': completed = assessment.status === 'approved' || assessment.status === 'pending-review'; break;
      }
      return { ...item, completed };
    });
    return items;
  }, [assessment]);

  const [checkItems, setCheckItems] = useState<ChecklistItem[]>(autoChecklist);
  const completedCount = checkItems.filter(i => i.completed).length;
  const totalCount = checkItems.length;

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Assessment not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isCurrentQuarter = assessment.reportingPeriod.includes('2025');
  const canEdit = !isGlobalView && isCurrentQuarter && ['draft', 'not-started'].includes(assessment.status);
  const canApprove = isGlobalView && assessment.status === 'pending-review';

  const handleApprove = () => {
    toast({ title: 'Assessment Approved', description: `${assessment.id} has been approved.` });
  };

  const handleDownloadAttachment = (name: string) => {
    const blob = new Blob([`Mock file content for ${name}`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleCheckItem = (itemId: string) => {
    setCheckItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i));
  };

  const categories = [...new Set(checkItems.map(i => i.category))];

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
            </div>
            <p className="text-sm text-muted-foreground">{assessment.operationalUnit}</p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link to="/new-assessment">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Data
                </Button>
              </Link>
            )}
            {canApprove && (
              <Button size="sm" className="gap-1.5" onClick={handleApprove}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Assessment
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{assessment.id} · Rev {assessment.revision}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{assessment.reportingPeriod}</span>
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Owner: {assessment.owner}</span>
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />HSEO: {assessment.siteHSEO}</span>
        </div>
      </div>

      {/* Flags */}
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

      {(assessment.reuseWastewater || assessment.reuseSludge) && (
        <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-2">
            <Recycle className="h-4 w-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-foreground">Special Reuse Flags</p>
              {assessment.reuseWastewater && <p className="text-xs text-muted-foreground">• Treated wastewater reused for irrigation</p>}
              {assessment.reuseSludge && <p className="text-xs text-muted-foreground">• Sludge/biomass reused for land application</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!assessment.exempt && (
        <Tabs defaultValue="substances" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="substances" className="gap-1.5">
              <Droplets className="h-3.5 w-3.5" /> Substances
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Site Summary
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Attachments
              {(assessment.attachments?.length ?? 0) > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 rounded-full">
                  {assessment.attachments?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Checklist
              <span className="ml-1 text-xs bg-muted-foreground/10 text-muted-foreground px-1.5 rounded-full">
                {completedCount}/{totalCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="substances">
            <SubstanceTable substances={assessment.substances} />
          </TabsContent>

          <TabsContent value="summary">
            <SiteSummary assessment={assessment} />
          </TabsContent>

          <TabsContent value="attachments">
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Supporting Documents</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evidence and documentation uploaded during data entry
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {(!assessment.attachments || assessment.attachments.length === 0) ? (
                  <div className="p-8 text-center">
                    <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No attachments uploaded</p>
                  </div>
                ) : (
                  assessment.attachments.map((att, i) => {
                    const substance = att.substanceId
                      ? assessment.substances.find(s => s.id === att.substanceId)
                      : null;
                    return (
                      <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{att.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{att.size}</span>
                              <span>·</span>
                              <span>Uploaded {att.uploadedDate}</span>
                              {substance && (
                                <>
                                  <span>·</span>
                                  <span className="text-primary">{substance.inn}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleDownloadAttachment(att.name)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <div className="space-y-4">
              {/* Progress */}
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Assessment Checklist</h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {completedCount} / {totalCount} complete
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
                {completedCount === totalCount && (
                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All items confirmed — ready for approval
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Items auto-populate based on assessment progress. You can also manually check off items.
                </p>
              </div>

              {categories.map(cat => (
                <div key={cat} className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="px-5 py-2.5 bg-muted/30 border-b border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h4>
                  </div>
                  <div className="divide-y divide-border/50">
                    {checkItems
                      .filter(i => i.category === cat)
                      .map(item => (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleCheckItem(item.id)}
                            className="mt-0.5"
                          />
                          <span className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Comments */}
      {assessment.comments && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold mb-2">Assessment Comments</h3>
          <p className="text-sm text-muted-foreground">{assessment.comments}</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentDetail;
