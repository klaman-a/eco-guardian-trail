import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewAssessment = () => {
  const navigate = useNavigate();
  const [exempt, setExempt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would save to database
    navigate('/assessments');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/assessments" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-2xl font-bold">New Risk Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new effluent risk assessment for a manufacturing site</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Site Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site" className="text-xs">Site Name</Label>
              <Input id="site" placeholder="e.g. Basel Manufacturing Site" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs">Operational Unit</Label>
              <Input id="unit" placeholder="e.g. Solid Dosage Forms – Building A" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="period" className="text-xs">Reporting Period</Label>
              <Input id="period" placeholder="e.g. 2025" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner" className="text-xs">Assessment Owner</Label>
              <Input id="owner" placeholder="Full name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hseo" className="text-xs">Site HSEO</Label>
              <Input id="hseo" placeholder="Full name" required />
            </div>
          </div>
        </div>

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

        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Special Conditions</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch />
              <span className="text-sm">Treated wastewater reused for irrigation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch />
              <span className="text-sm">Sludge or biomass reused for land application</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/assessments')}>Cancel</Button>
          <Button type="submit" className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Assessment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewAssessment;
