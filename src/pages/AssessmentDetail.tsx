import { useParams, Link } from 'react-router-dom';
import { mockAssessments, defaultChecklist } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubstanceTable } from '@/components/SubstanceTable';
import { SiteSummary } from '@/components/SiteSummary';
import { AssessmentChecklist } from '@/components/AssessmentChecklist';
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
} from 'lucide-react';

const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const assessment = mockAssessments.find((a) => a.id === id);

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Assessment not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

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
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{assessment.id} · Rev {assessment.revision}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{assessment.reportingPeriod}</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{assessment.owner}</span>
          </div>
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
              <p className="text-xs text-muted-foreground mt-1">Additional soil/sludge risk assessments required.</p>
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
            <TabsTrigger value="checklist" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="substances">
            <SubstanceTable substances={assessment.substances} />
          </TabsContent>

          <TabsContent value="summary">
            <SiteSummary assessment={assessment} />
          </TabsContent>

          <TabsContent value="checklist">
            <AssessmentChecklist items={defaultChecklist} />
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
