export type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending' | 'draft' | 'exempt';
export type RiskZone = 'compliant' | 'low' | 'medium' | 'high';
export type AssessmentStep = 'step1' | 'step2';
export type ApprovalStatus = 'not-started' | 'draft' | 'submitted' | 'pending-review' | 'approved' | 'signed-off';
export type SubstanceCategory = 'antibiotic' | 'analgesic' | 'cardiovascular' | 'gastrointestinal' | 'antihistamine' | 'lipid-lowering' | 'antidiabetic';

export const RISK_THRESHOLDS = {
  compliant: 0.1,   // PEC/PNEC < 0.1
  low: 0.5,         // 0.1 ≤ PEC/PNEC < 0.5
  medium: 1.0,      // 0.5 ≤ PEC/PNEC < 1.0
  high: Infinity,    // PEC/PNEC ≥ 1.0
};

export function getRiskZone(pecPnec: number | undefined): RiskZone {
  if (pecPnec === undefined) return 'compliant';
  if (pecPnec < RISK_THRESHOLDS.compliant) return 'compliant';
  if (pecPnec < RISK_THRESHOLDS.low) return 'low';
  if (pecPnec < RISK_THRESHOLDS.medium) return 'medium';
  return 'high';
}

export const RISK_ZONE_COLORS: Record<RiskZone, string> = {
  compliant: 'hsl(152, 60%, 36%)',
  low: 'hsl(175, 55%, 40%)',
  medium: 'hsl(38, 92%, 50%)',
  high: 'hsl(0, 72%, 51%)',
};

export const RISK_ZONE_LABELS: Record<RiskZone, string> = {
  compliant: 'Compliant',
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

export interface SiteConstants {
  retentionTime: number;        // hours
  flowToWWT: number;            // m³/day
  exitFlowWWT: number;          // m³/day
  receivingWaterFlow: number;   // m³/s
  dilutionFactor: number;
  manualDilution: boolean;
}

export interface DrugSubstance {
  id: string;
  inn: string;
  casNumber: string;
  category: SubstanceCategory;
  pnecValue: number | null;
  pnecSource: string;
  pbtClassification: 'none' | 'PBT' | 'vPvB';
  biodegradable: boolean;
  noEnvironmentalConcern: boolean;
  lastReviewDate: string;

  // Production data
  amountPerBatch: number;
  batchesPerWeek: number;
  batchesPerYear: number;
  batchesPerCampaign: number;
  lossPerBatch: number;
  lossPerCampaign: number;

  // Removal rates
  removalSolidWaste: number;       // % 0-100
  removalPreTreatment: number;     // % 0-100
  removalWWT: number;              // % 0-100
  eliminationEvidence: string;

  // Legacy aliases
  eliminationSolidWaste: number;
  eliminationPreTreatment: number;

  // Calculated
  annualProcessed?: number;
  annualLoss?: number;
  percentageLoss?: number;
  annualLoadToWastewater?: number;

  // Wastewater
  wastewaterFlow?: number;
  treatmentEliminationRate?: number;
  effluentFlow?: number;
  measuredConcentration?: number | null;

  // Environmental
  receivingWaterLowFlow?: number;
  dilutionFactor?: number;

  // Results
  pecEffluent?: number;
  pecSurfaceWater?: number;
  pecPnec?: number;
  mecPnec?: number | null;
  complianceStatus?: ComplianceStatus;
  riskZone?: RiskZone;
  assessmentStep?: AssessmentStep;

  // Risk zone requirements
  riskComment?: string;
  riskAttachment?: string;
}

export interface AttachmentInfo {
  name: string;
  size: string;
  type: string;
  uploadedDate: string;
  substanceId?: string;
}

export interface Assessment {
  id: string;
  siteName: string;
  operationalUnit: string;
  reportingPeriod: string;
  revision: number;
  status: ApprovalStatus;
  owner: string;
  siteHSEO: string;
  createdDate: string;
  lastModified: string;
  substances: DrugSubstance[];
  exempt: boolean;
  exemptJustification?: string;
  comments: string;
  checklistComplete: boolean;
  reuseWastewater: boolean;
  reuseSludge: boolean;
  attachments?: AttachmentInfo[];
  siteConstants?: SiteConstants;
  formulaVersion: string;
  calculationVersion: string;
  reviewStarted?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

export interface ProgressMilestone {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
  substeps: { label: string; done: boolean }[];
}

export function getProgressMilestones(assessment: Assessment): ProgressMilestone[] {
  const s = assessment.status;
  const hasData = assessment.substances.length > 0 || assessment.exempt;
  const isSubmitted = ['submitted', 'pending-review', 'approved', 'signed-off'].includes(s);
  const isReviewed = ['approved', 'signed-off'].includes(s);
  const isApproved = ['approved', 'signed-off'].includes(s);
  const isSignedOff = s === 'signed-off';

  return [
    {
      key: 'enter-data',
      label: 'Enter Data',
      done: hasData && s !== 'not-started',
      active: s === 'draft' || s === 'not-started',
      substeps: [
        { label: 'Identify substances', done: hasData },
        { label: 'Enter production data', done: hasData && assessment.substances.every(sub => sub.batchesPerYear > 0) },
        { label: 'Upload evidence', done: (assessment.attachments?.length ?? 0) > 0 },
      ],
    },
    {
      key: 'submit',
      label: 'Submit',
      done: isSubmitted,
      active: s === 'draft',
      substeps: [
        { label: 'Validate data', done: isSubmitted },
        { label: 'Submit for review', done: isSubmitted },
      ],
    },
    {
      key: 'review',
      label: 'Review',
      done: isReviewed,
      active: s === 'pending-review',
      substeps: [
        { label: 'Review initiated', done: assessment.reviewStarted || isReviewed },
        { label: 'Reviewer assessment', done: isReviewed },
      ],
    },
    {
      key: 'approved',
      label: 'Approved',
      done: isApproved,
      active: false,
      substeps: [
        { label: 'Approval confirmed', done: isApproved },
        { label: 'Generate report', done: isApproved },
      ],
    },
    {
      key: 'sign-off',
      label: 'Sign-off',
      done: isSignedOff,
      active: s === 'approved',
      substeps: [
        { label: 'Final sign-off', done: isSignedOff },
        { label: 'Archive assessment', done: isSignedOff },
      ],
    },
  ];
}

export function getEditButtonText(status: ApprovalStatus, reviewStarted?: boolean): string | null {
  switch (status) {
    case 'not-started':
    case 'draft':
      return 'Enter Data';
    case 'submitted':
    case 'pending-review':
      return reviewStarted ? 'Request Edit' : 'Edit Data';
    case 'approved':
      return 'Edit Data';
    case 'signed-off':
      return null;
    default:
      return 'Enter Data';
  }
}

export function calculateSubstanceMetrics(s: DrugSubstance): DrugSubstance {
  const annualProcessed = s.amountPerBatch * s.batchesPerYear;
  const annualLoss = s.lossPerBatch * s.batchesPerYear;
  const percentageLoss = annualProcessed > 0 ? (annualLoss / annualProcessed) * 100 : 0;

  const solidWasteElim = annualLoss * (s.removalSolidWaste / 100);
  const preTreatElim = annualLoss * (s.removalPreTreatment / 100);
  const wwtElim = annualLoss * (s.removalWWT / 100);
  const annualLoadToWastewater = Math.max(0, annualLoss - solidWasteElim - preTreatElim - wwtElim);

  let pecEffluent: number | undefined;
  let pecSurfaceWater: number | undefined;
  let pecPnec: number | undefined;
  let mecPnec: number | null = null;

  if (s.wastewaterFlow && s.wastewaterFlow > 0) {
    const dailyLoad = annualLoadToWastewater / 365;
    const dailyLoadUg = dailyLoad * 1e9;
    const flowLPerDay = s.wastewaterFlow * 1000;
    const concBeforeTreatment = dailyLoadUg / flowLPerDay;
    const treatmentRate = s.treatmentEliminationRate || 0;
    pecEffluent = concBeforeTreatment * (1 - treatmentRate / 100);
  }

  if (pecEffluent !== undefined) {
    const dilution = s.dilutionFactor || 10;
    pecSurfaceWater = pecEffluent / dilution;
  }

  if (pecSurfaceWater !== undefined && s.pnecValue && s.pnecValue > 0) {
    pecPnec = pecSurfaceWater / s.pnecValue;
  }

  if (s.measuredConcentration !== null && s.measuredConcentration !== undefined && s.pnecValue && s.pnecValue > 0) {
    const dilution = s.dilutionFactor || 10;
    mecPnec = (s.measuredConcentration / dilution) / s.pnecValue;
  }

  let complianceStatus: ComplianceStatus = 'pending';
  if (s.noEnvironmentalConcern) {
    complianceStatus = 'exempt';
  } else if (pecPnec !== undefined) {
    complianceStatus = pecPnec < 1.0 ? 'compliant' : 'non-compliant';
    if (mecPnec !== null && mecPnec >= 1.0) {
      complianceStatus = 'non-compliant';
    }
  }

  const riskZone = s.noEnvironmentalConcern ? 'compliant' as RiskZone : getRiskZone(pecPnec);

  const assessmentStep: AssessmentStep =
    (s.treatmentEliminationRate && s.treatmentEliminationRate > 0) || s.measuredConcentration ? 'step2' : 'step1';

  return {
    ...s,
    annualProcessed,
    annualLoss,
    percentageLoss,
    annualLoadToWastewater,
    pecEffluent,
    pecSurfaceWater,
    pecPnec,
    mecPnec,
    complianceStatus,
    riskZone,
    assessmentStep,
  };
}
