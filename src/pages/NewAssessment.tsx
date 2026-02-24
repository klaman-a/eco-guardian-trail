import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, FlaskConical, Save, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITES = [
  'Basel Manufacturing Site',
  'Dublin API Facility',
  'Singapore Packaging Center',
  'Munich R&D Lab',
];

const PRODUCTS = [
  { name: 'Metformin Hydrochloride', pnec: 10 },
  { name: 'Ibuprofen', pnec: 1.65 },
  { name: 'Amoxicillin Trihydrate', pnec: 0.078 },
  { name: 'Paracetamol', pnec: 9.2 },
  { name: 'Diclofenac Sodium', pnec: 0.05 },
];

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

const CURRENT_PERIOD = getCurrentQuarter();
const ASSESSMENT_OWNER = 'Dr. Elena Fischer';

// Simplified PEC/PNEC: assumes 0.5kg loss/batch, 500m³/day WW flow, dilution 10
function calcPecPnec(batches: number, _productPerBatch: number, pnec: number | null): number | null {
  if (!pnec || pnec <= 0 || batches <= 0) return null;
  const lossPerBatch = 0.5; // kg
  const annualLoss = lossPerBatch * batches;
  const dailyLoad = annualLoss / 365;
  const dailyLoadUg = dailyLoad * 1e9;
  const flowLPerDay = 500 * 1000;
  const pecEffluent = dailyLoadUg / flowLPerDay;
  const pecSurface = pecEffluent / 10;
  return pecSurface / pnec;
}

interface ProductSection {
  id: string;
  product: string;
  batches: number | '';
  productPerBatch: number | '';
}

let nextId = 1;
const createSection = (): ProductSection => ({
  id: String(nextId++),
  product: '',
  batches: '',
  productPerBatch: '',
});

const MAX_SECTIONS = 50;

const NewAssessment = () => {
  const navigate = useNavigate();
  const [site, setSite] = useState('');
  const [exempt, setExempt] = useState(false);
  const [reuseWastewater, setReuseWastewater] = useState(false);
  const [reuseSludge, setReuseSludge] = useState(false);
  const [sections, setSections] = useState<ProductSection[]>([createSection()]);

  const updateSection = useCallback((id: string, field: keyof ProductSection, value: string | number) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addSection = useCallback(() => {
    if (sections.length >= MAX_SECTIONS) return;
    setSections(prev => [...prev, createSection()]);
  }, [sections.length]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/assessments');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <Link to="/assessments" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-2xl font-bold">New Risk Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new effluent risk assessment for a manufacturing site</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Site Information */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Site Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site" className="text-xs">Site Name</Label>
              <Select value={site} onValueChange={setSite} required>
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {SITES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="justification" className="text-xs">Justification</Label>
              <Textarea id="justification" placeholder="Document why no process wastewater is discharged..." rows={3} required />
            </div>
          )}
        </div>

        {/* Product Sections */}
        {!exempt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Product Data Entry</h2>
              <span className="text-xs text-muted-foreground">{sections.length} / {MAX_SECTIONS} sections</span>
            </div>

            {sections.map((section, index) => (
              <ProductCard
                key={section.id}
                section={section}
                index={index}
                canRemove={sections.length > 1}
                onUpdate={updateSection}
                onRemove={removeSection}
              />
            ))}

            {sections.length < MAX_SECTIONS && (
              <Button type="button" variant="outline" className="w-full gap-1.5 border-dashed" onClick={addSection}>
                <Plus className="h-4 w-4" /> Add Product Section
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
          <Button type="button" variant="outline" onClick={() => navigate('/assessments')}>Cancel</Button>
          <Button type="button" variant="secondary" className="gap-1.5" onClick={() => { /* save as draft */ navigate('/assessments'); }}>
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

// --- Product Card Sub-component ---

interface ProductCardProps {
  section: ProductSection;
  index: number;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof ProductSection, value: string | number) => void;
  onRemove: (id: string) => void;
}

const ProductCard = ({ section, index, canRemove, onUpdate, onRemove }: ProductCardProps) => {
  const selectedProduct = PRODUCTS.find(p => p.name === section.product);
  const batches = typeof section.batches === 'number' ? section.batches : 0;
  const productPerBatch = typeof section.productPerBatch === 'number' ? section.productPerBatch : 0;

  const totalProduct = useMemo(() => batches * productPerBatch, [batches, productPerBatch]);
  const pecPnec = useMemo(
    () => calcPecPnec(batches, productPerBatch, selectedProduct?.pnec ?? null),
    [batches, productPerBatch, selectedProduct]
  );

  const isCompliant = pecPnec !== null && pecPnec < 1.0;
  const isNonCompliant = pecPnec !== null && pecPnec >= 1.0;

  return (
    <div className="bg-card rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Product {index + 1}</h3>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(section.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Product</Label>
          <Select value={section.product} onValueChange={(v) => onUpdate(section.id, 'product', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {PRODUCTS.map(p => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Number of Batches</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={section.batches}
            onChange={(e) => onUpdate(section.id, 'batches', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Product per Batch (kg)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={section.productPerBatch}
            onChange={(e) => onUpdate(section.id, 'productPerBatch', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </div>

      {/* Calculated fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Total Product (kg)</Label>
          <div className="h-10 flex items-center px-3 rounded-md bg-accent/50 border border-accent text-sm font-medium text-accent-foreground font-mono">
            {totalProduct > 0 ? totalProduct.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">PEC / PNEC</Label>
          <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-medium font-mono ${
            pecPnec === null
              ? 'bg-accent/50 border-accent text-accent-foreground'
              : isCompliant
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            {pecPnec !== null ? pecPnec.toFixed(4) : '—'}
            {isCompliant && <span className="ml-2 text-xs opacity-75">Compliant</span>}
            {isNonCompliant && <span className="ml-2 text-xs opacity-75">Non-compliant</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssessment;
