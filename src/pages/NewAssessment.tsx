import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, FlaskConical, Save, Send, Paperclip, X, FileText, AlertTriangle } from 'lucide-react';
import { useSiteContext, SITE_METADATA } from '@/contexts/SiteContext';
import { ALL_PRODUCTS, SITE_PRODUCTS, SUBSTANCE_CATEGORY_LABELS } from '@/data/mockData';
import { getRiskZone, RISK_ZONE_LABELS, RiskZone } from '@/types/assessment';
import { RiskBadge } from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

const CURRENT_PERIOD = getCurrentQuarter();
const ASSESSMENT_OWNER = 'Dr. Elena Fischer';

function calcPecPnec(
  batches: number, lossPerBatch: number,
  remSolid: number, remPre: number, remWWT: number,
  wwFlow: number, treatRate: number,
  dilution: number, pnec: number | null,
): number | null {
  if (!pnec || pnec <= 0 || batches <= 0) return null;
  const annualLoss = lossPerBatch * batches;
  const afterRemoval = annualLoss * (1 - remSolid / 100) * (1 - remPre / 100) * (1 - remWWT / 100);
  const dailyLoad = afterRemoval / 365;
  const dailyLoadUg = dailyLoad * 1e9;
  const flowLPerDay = wwFlow * 1000;
  if (flowLPerDay <= 0) return null;
  const pecEffluent = dailyLoadUg / flowLPerDay * (1 - treatRate / 100);
  const pecSurface = pecEffluent / dilution;
  return pecSurface / pnec;
}

interface SubstanceSection {
  id: string;
  substance: string;
  batches: number | '';
  amountPerBatch: number | '';
  lossPerBatch: number | '';
  lossPerCampaign: number | '';
  removalSolidWaste: number | '';
  removalPreTreatment: number | '';
  removalWWT: number | '';
  files: File[];
  comment: string;
}

let nextId = 1;
const createSection = (): SubstanceSection => ({
  id: String(nextId++),
  substance: '',
  batches: '',
  amountPerBatch: '',
  lossPerBatch: '',
  lossPerCampaign: '',
  removalSolidWaste: '',
  removalPreTreatment: '',
  removalWWT: '',
  files: [],
  comment: '',
});

const MAX_SECTIONS = 50;

const NewAssessment = () => {
  const navigate = useNavigate();
  const { selectedSite } = useSiteContext();
  const siteConstants = selectedSite ? SITE_METADATA[selectedSite]?.constants : null;

  const [exempt, setExempt] = useState(false);
  const [reuseWastewater, setReuseWastewater] = useState(false);
  const [reuseSludge, setReuseSludge] = useState(false);
  const [sections, setSections] = useState<SubstanceSection[]>([createSection()]);
  const [manualDilution, setManualDilution] = useState(siteConstants?.manualDilution ?? false);
  const [dilutionOverride, setDilutionOverride] = useState<number | ''>(siteConstants?.dilutionFactor ?? '');

  // Site constants state
  const [retentionTime] = useState(siteConstants?.retentionTime ?? 0);
  const [flowToWWT] = useState(siteConstants?.flowToWWT ?? 0);
  const [exitFlowWWT] = useState(siteConstants?.exitFlowWWT ?? 0);
  const [receivingWaterFlow] = useState(siteConstants?.receivingWaterFlow ?? 0);

  const calculatedDilution = useMemo(() => {
    if (manualDilution) return typeof dilutionOverride === 'number' ? dilutionOverride : 10;
    if (exitFlowWWT > 0 && receivingWaterFlow > 0) {
      return Math.round(((receivingWaterFlow * 86400) / (exitFlowWWT)) * 10) / 10;
    }
    return 10;
  }, [manualDilution, dilutionOverride, exitFlowWWT, receivingWaterFlow]);

  const siteProductNames = selectedSite ? (SITE_PRODUCTS[selectedSite] ?? []) : ALL_PRODUCTS.map(p => p.name);
  const availableProducts = ALL_PRODUCTS.filter(p => siteProductNames.includes(p.name));

  const updateSection = useCallback((id: string, field: keyof SubstanceSection, value: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addFiles = useCallback((id: string, newFiles: File[]) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, files: [...s.files, ...newFiles] } : s));
  }, []);

  const removeFile = useCallback((sectionId: string, fileIndex: number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, files: s.files.filter((_, i) => i !== fileIndex) } : s));
  }, []);

  const addSection = useCallback(() => {
    if (sections.length >= MAX_SECTIONS) return;
    setSections(prev => [...prev, createSection()]);
  }, [sections.length]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }, []);

  // Validation
  const validate = (): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!exempt) {
      sections.forEach((s, i) => {
        if (!s.substance) errors.push(`Substance ${i + 1}: No substance selected`);
        if (s.batches === '' || s.batches <= 0) errors.push(`Substance ${i + 1}: Batches required`);
        if (s.lossPerBatch === '' || Number(s.lossPerBatch) <= 0) errors.push(`Substance ${i + 1}: Loss per batch required`);

        // Check risk zone - if in risk, comment or attachment required
        const product = availableProducts.find(p => p.name === s.substance);
        const pecPnec = calcPecPnec(
          typeof s.batches === 'number' ? s.batches : 0,
          typeof s.lossPerBatch === 'number' ? s.lossPerBatch : 0,
          typeof s.removalSolidWaste === 'number' ? s.removalSolidWaste : 0,
          typeof s.removalPreTreatment === 'number' ? s.removalPreTreatment : 0,
          typeof s.removalWWT === 'number' ? s.removalWWT : 0,
          flowToWWT, 0, calculatedDilution, product?.pnec ?? null,
        );
        const rz = getRiskZone(pecPnec ?? undefined);
        if (rz === 'medium' || rz === 'high') {
          if (!s.comment && s.files.length === 0) {
            errors.push(`Substance ${i + 1} (${s.substance || 'unnamed'}): Comment or attachment required for ${RISK_ZONE_LABELS[rz]} substances`);
          }
        }
      });

      // Check for same removal rates
      if (sections.length > 1) {
        const rateKeys = sections.map(s => `${s.removalSolidWaste}-${s.removalPreTreatment}-${s.removalWWT}`);
        const unique = new Set(rateKeys);
        if (unique.size === 1 && sections.every(s => s.substance)) {
          warnings.push('All substances have identical removal rates. Please verify this is correct.');
        }
      }
    }

    return { errors, warnings };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { errors, warnings } = validate();

    if (errors.length > 0) {
      toast({
        title: 'Validation Failed',
        description: errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ''),
        variant: 'destructive',
      });
      return;
    }

    if (warnings.length > 0) {
      toast({
        title: 'Warning',
        description: warnings[0],
      });
    }

    toast({ title: 'Assessment Submitted', description: 'Your data has been submitted for review.' });
    navigate('/assessment-summary');
  };

  const handleSaveDraft = () => {
    toast({ title: 'Draft Saved', description: 'Your progress has been saved.' });
    navigate('/assessment-summary');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <Link to="/assessment-summary" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-2xl font-bold">Risk Assessment – Data Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedSite ?? 'Select a site'} · {CURRENT_PERIOD}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Site Information */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Site Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Site Name</Label>
              <Input value={selectedSite ?? ''} disabled className="bg-muted text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assessment Owner</Label>
              <Input value={ASSESSMENT_OWNER} disabled className="bg-muted text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reporting Period</Label>
              <Input value={CURRENT_PERIOD} disabled className="bg-muted text-muted-foreground" />
            </div>
          </div>

          {/* Site Constants */}
          <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mt-4">Site Constants</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Retention Time (hrs)</Label>
              <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
                {retentionTime}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Flow to WWT (m³/day)</Label>
              <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
                {flowToWWT}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exit Flow WWT (m³/day)</Label>
              <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
                {exitFlowWWT}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Receiving Water (m³/s)</Label>
              <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
                {receivingWaterFlow}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dilution Factor</Label>
              {manualDilution ? (
                <Input
                  type="number" min={1} step={0.1}
                  value={dilutionOverride}
                  onChange={(e) => setDilutionOverride(e.target.value === '' ? '' : Number(e.target.value))}
                />
              ) : (
                <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
                  {calculatedDilution}
                </div>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <Checkbox checked={manualDilution} onCheckedChange={(v) => setManualDilution(!!v)} />
            <span className="text-xs text-muted-foreground">Water flow data unavailable — enter dilution factor manually</span>
          </label>
        </div>

        {/* Exemption */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Exemption</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="exempt" className="text-xs text-muted-foreground">No wastewater discharge</Label>
              <Switch id="exempt" checked={exempt} onCheckedChange={setExempt} />
            </div>
          </div>
          {exempt && (
            <div className="space-y-1.5">
              <Label className="text-xs">Justification</Label>
              <Textarea placeholder="Document why no process wastewater is discharged..." rows={3} required />
            </div>
          )}
        </div>

        {/* Substance Sections */}
        {!exempt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Substance Data Entry</h2>
              <span className="text-xs text-muted-foreground">{sections.length} / {MAX_SECTIONS}</span>
            </div>

            {sections.map((section, index) => (
              <SubstanceCard
                key={section.id}
                section={section}
                index={index}
                canRemove={sections.length > 1}
                products={availableProducts}
                flowToWWT={flowToWWT}
                dilutionFactor={calculatedDilution}
                onUpdate={updateSection}
                onRemove={removeSection}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
              />
            ))}

            {sections.length < MAX_SECTIONS && (
              <Button type="button" variant="outline" className="w-full gap-1.5 border-dashed" onClick={addSection}>
                <Plus className="h-4 w-4" /> Add Substance Section
              </Button>
            )}
          </div>
        )}

        {/* Special Conditions */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Special Conditions</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch checked={reuseWastewater} onCheckedChange={setReuseWastewater} />
              <span className="text-sm">Treated wastewater reused for irrigation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch checked={reuseSludge} onCheckedChange={setReuseSludge} />
              <span className="text-sm">Sludge or biomass reused for land application</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/assessment-summary')}>Cancel</Button>
          <Button type="button" variant="secondary" className="gap-1.5" onClick={handleSaveDraft}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button type="submit" className="gap-1.5">
            <Send className="h-4 w-4" /> Submit Assessment
          </Button>
        </div>
      </form>
    </div>
  );
};

// ── Substance Card ──
interface SubstanceCardProps {
  section: SubstanceSection;
  index: number;
  canRemove: boolean;
  products: { name: string; pnec: number; casNumber: string; category: string }[];
  flowToWWT: number;
  dilutionFactor: number;
  onUpdate: (id: string, field: keyof SubstanceSection, value: any) => void;
  onRemove: (id: string) => void;
  onAddFiles: (id: string, files: File[]) => void;
  onRemoveFile: (sectionId: string, fileIndex: number) => void;
}

const SubstanceCard = ({ section, index, canRemove, products, flowToWWT, dilutionFactor, onUpdate, onRemove, onAddFiles, onRemoveFile }: SubstanceCardProps) => {
  const selectedProduct = products.find(p => p.name === section.substance);
  const batches = typeof section.batches === 'number' ? section.batches : 0;
  const lossPerBatch = typeof section.lossPerBatch === 'number' ? section.lossPerBatch : 0;
  const remSolid = typeof section.removalSolidWaste === 'number' ? section.removalSolidWaste : 0;
  const remPre = typeof section.removalPreTreatment === 'number' ? section.removalPreTreatment : 0;
  const remWWT = typeof section.removalWWT === 'number' ? section.removalWWT : 0;

  const pecPnec = useMemo(
    () => calcPecPnec(batches, lossPerBatch, remSolid, remPre, remWWT, flowToWWT, 0, dilutionFactor, selectedProduct?.pnec ?? null),
    [batches, lossPerBatch, remSolid, remPre, remWWT, flowToWWT, dilutionFactor, selectedProduct]
  );

  const riskZone: RiskZone = getRiskZone(pecPnec ?? undefined);
  const needsJustification = riskZone === 'medium' || riskZone === 'high';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { onAddFiles(section.id, Array.from(e.target.files)); e.target.value = ''; }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-5 space-y-4 ${
      riskZone === 'high' ? 'border-danger/30' : riskZone === 'medium' ? 'border-warning/30' : 'border-border'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Substance {index + 1}</h3>
          {selectedProduct && (
            <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
              {selectedProduct.category.replace('-', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pecPnec !== null && <RiskBadge zone={riskZone} />}
          {canRemove && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(section.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Row 1: substance, batches, amount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Substance</Label>
          <Select value={section.substance} onValueChange={(v) => onUpdate(section.id, 'substance', v)}>
            <SelectTrigger><SelectValue placeholder="Select substance" /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {products.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Batches / Year</Label>
          <Input type="number" min={0} placeholder="0" value={section.batches}
            onChange={(e) => onUpdate(section.id, 'batches', e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Amount per Batch (kg)</Label>
          <Input type="number" min={0} step="0.01" placeholder="0" value={section.amountPerBatch}
            onChange={(e) => onUpdate(section.id, 'amountPerBatch', e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>

      {/* Row 2: loss data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Loss per Batch (kg)</Label>
          <Input type="number" min={0} step="0.001" placeholder="0" value={section.lossPerBatch}
            onChange={(e) => onUpdate(section.id, 'lossPerBatch', e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Loss per Campaign (kg)</Label>
          <Input type="number" min={0} step="0.01" placeholder="0" value={section.lossPerCampaign}
            onChange={(e) => onUpdate(section.id, 'lossPerCampaign', e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>

      {/* Row 3: Removal rates */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Removal Rates (%)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Solid Waste</Label>
            <Input type="number" min={0} max={100} placeholder="0" value={section.removalSolidWaste}
              onChange={(e) => onUpdate(section.id, 'removalSolidWaste', e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">In-Process Pretreatment</Label>
            <Input type="number" min={0} max={100} placeholder="0" value={section.removalPreTreatment}
              onChange={(e) => onUpdate(section.id, 'removalPreTreatment', e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Wastewater Treatment</Label>
            <Input type="number" min={0} max={100} placeholder="0" value={section.removalWWT}
              onChange={(e) => onUpdate(section.id, 'removalWWT', e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Calculated fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">PNEC (µg/L)</Label>
          <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-mono">
            {selectedProduct ? selectedProduct.pnec : '—'}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">PEC / PNEC</Label>
          <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-medium font-mono ${
            pecPnec === null ? 'bg-accent/50 border-accent text-accent-foreground'
              : riskZone === 'high' ? 'bg-danger/10 border-danger/30 text-danger'
              : riskZone === 'medium' ? 'bg-warning/10 border-warning/30 text-warning'
              : riskZone === 'low' ? 'bg-[hsl(175,55%,40%)]/10 border-[hsl(175,55%,40%)]/30 text-[hsl(175,55%,30%)]'
              : 'bg-success/10 border-success/30 text-success'
          }`}>
            {pecPnec !== null ? pecPnec.toFixed(4) : '—'}
            {pecPnec !== null && <span className="ml-2 text-xs opacity-75">{RISK_ZONE_LABELS[riskZone]}</span>}
          </div>
        </div>
      </div>

      {/* Risk zone justification */}
      {needsJustification && (
        <div className={`p-3 rounded-md border ${riskZone === 'high' ? 'bg-danger/5 border-danger/15' : 'bg-warning/5 border-warning/15'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className={`h-3.5 w-3.5 ${riskZone === 'high' ? 'text-danger' : 'text-warning'}`} />
            <span className="text-xs font-medium">{RISK_ZONE_LABELS[riskZone]} — comment or attachment required</span>
          </div>
          <Textarea
            placeholder="Provide justification or mitigation details..."
            rows={2}
            value={section.comment}
            onChange={(e) => onUpdate(section.id, 'comment', e.target.value)}
            className="text-xs"
          />
        </div>
      )}

      {/* Files */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Supporting Evidence</Label>
          <input ref={fileInputRef} type="file" multiple className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt" onChange={handleFileChange} />
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-3 w-3" /> Attach file
          </Button>
        </div>
        {section.files.length > 0 ? (
          <div className="space-y-1.5">
            {section.files.map((file, fi) => (
              <div key={fi} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                <button type="button" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => onRemoveFile(section.id, fi)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">No files attached</p>
        )}
      </div>
    </div>
  );
};

export default NewAssessment;
