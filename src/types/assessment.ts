export type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending' | 'draft' | 'exempt';
export type AssessmentStep = 'step1' | 'step2';
export type ApprovalStatus = 'draft' | 'pending-review' | 'approved' | 'locked';

export interface DrugSubstance {
  id: string;
  inn: string; // International Nonproprietary Name
  casNumber: string;
  pnecValue: number | null; // µg/L
  pnecSource: string;
  pbtClassification: 'none' | 'PBT' | 'vPvB';
  biodegradable: boolean;
  noEnvironmentalConcern: boolean;
  lastReviewDate: string;

  // Production data (worst-case)
  amountPerBatch: number; // kg
  batchesPerWeek: number;
  batchesPerYear: number;
  batchesPerCampaign: number;
  lossPerBatch: number; // kg
  eliminationSolidWaste: number; // percentage 0-100
  eliminationPreTreatment: number; // percentage 0-100
  eliminationEvidence: string;

  // Calculated
  annualProcessed?: number; // kg/year
  annualLoss?: number; // kg/year
  percentageLoss?: number;
  annualLoadToWastewater?: number; // kg/year

  // Wastewater treatment
  wastewaterFlow?: number; // m³/day
  treatmentEliminationRate?: number; // percentage 0-100
  effluentFlow?: number; // m³/day
  measuredConcentration?: number | null; // µg/L

  // Environmental
  receivingWaterLowFlow?: number; // m³/s
  dilutionFactor?: number;

  // Calculated results
  pecEffluent?: number; // µg/L
  pecSurfaceWater?: number; // µg/L
  pecPnec?: number;
  mecPnec?: number | null;
  complianceStatus?: ComplianceStatus;
  assessmentStep?: AssessmentStep;
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
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

// Calculation helpers
export function calculateSubstanceMetrics(s: DrugSubstance): DrugSubstance {
  const annualProcessed = s.amountPerBatch * s.batchesPerYear;
  const annualLoss = s.lossPerBatch * s.batchesPerYear;
  const percentageLoss = annualProcessed > 0 ? (annualLoss / annualProcessed) * 100 : 0;
  
  const solidWasteElimination = annualLoss * (s.eliminationSolidWaste / 100);
  const preTreatmentElimination = annualLoss * (s.eliminationPreTreatment / 100);
  const annualLoadToWastewater = annualLoss - solidWasteElimination - preTreatmentElimination;

  let pecEffluent: number | undefined;
  let pecSurfaceWater: number | undefined;
  let pecPnec: number | undefined;
  let mecPnec: number | null = null;

  if (s.wastewaterFlow && s.wastewaterFlow > 0) {
    const dailyLoad = annualLoadToWastewater / 365; // kg/day
    const dailyLoadUg = dailyLoad * 1e9; // µg/day
    const flowLPerDay = s.wastewaterFlow * 1000; // L/day
    const concentrationBeforeTreatment = dailyLoadUg / flowLPerDay;
    const treatmentRate = s.treatmentEliminationRate || 0;
    pecEffluent = concentrationBeforeTreatment * (1 - treatmentRate / 100);
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

  const assessmentStep: AssessmentStep = (s.treatmentEliminationRate && s.treatmentEliminationRate > 0) || s.measuredConcentration ? 'step2' : 'step1';

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
    assessmentStep,
  };
}
