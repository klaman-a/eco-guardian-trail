import { Assessment, DrugSubstance, ChecklistItem, AttachmentInfo, calculateSubstanceMetrics, SubstanceCategory } from '@/types/assessment';

// ── Attachments ──
const mockAttachments: Record<string, AttachmentInfo[]> = {
  'RA-2025-001': [
    { name: 'WW_Treatment_Certificate.pdf', size: '890 KB', type: 'pdf', uploadedDate: '2025-02-15' },
    { name: 'Metformin_PNEC_Review_2025.pdf', size: '2.4 MB', type: 'pdf', uploadedDate: '2025-01-20', substanceId: 'b1' },
    { name: 'Ibuprofen_Ecotox_Data.xlsx', size: '1.1 MB', type: 'xlsx', uploadedDate: '2025-01-22', substanceId: 'b2' },
    { name: 'Amoxicillin_ERA_Study.pdf', size: '4.2 MB', type: 'pdf', uploadedDate: '2025-02-20', substanceId: 'b3' },
  ],
  'RA-2025-002': [
    { name: 'CAPA_Diclofenac_Plan.docx', size: '520 KB', type: 'docx', uploadedDate: '2025-02-28' },
    { name: 'Diclofenac_EU_WatchList.pdf', size: '3.1 MB', type: 'pdf', uploadedDate: '2025-01-25', substanceId: 'd1' },
    { name: 'Cipro_Elimination_Evidence.pdf', size: '1.8 MB', type: 'pdf', uploadedDate: '2025-02-10', substanceId: 'd3' },
  ],
  'RA-2025-003': [
    { name: 'Paracetamol_NoConcern_Justification.pdf', size: '750 KB', type: 'pdf', uploadedDate: '2025-02-01', substanceId: 's1' },
  ],
  'RA-2025-004': [],
};

// ── Products ──
export interface ProductInfo {
  name: string;
  pnec: number;
  casNumber: string;
  category: SubstanceCategory;
}

export const ALL_PRODUCTS: ProductInfo[] = [
  { name: 'Metformin Hydrochloride', pnec: 10, casNumber: '1115-70-4', category: 'antidiabetic' },
  { name: 'Ibuprofen', pnec: 1.65, casNumber: '15687-27-1', category: 'analgesic' },
  { name: 'Amoxicillin Trihydrate', pnec: 0.078, casNumber: '61336-70-7', category: 'antibiotic' },
  { name: 'Paracetamol', pnec: 9.2, casNumber: '103-90-2', category: 'analgesic' },
  { name: 'Diclofenac Sodium', pnec: 0.05, casNumber: '15307-79-6', category: 'analgesic' },
  { name: 'Omeprazole', pnec: 4.5, casNumber: '73590-58-6', category: 'gastrointestinal' },
  { name: 'Atorvastatin Calcium', pnec: 0.12, casNumber: '134523-03-8', category: 'lipid-lowering' },
  { name: 'Ciprofloxacin HCl', pnec: 0.089, casNumber: '86393-32-0', category: 'antibiotic' },
  { name: 'Losartan Potassium', pnec: 3.8, casNumber: '124750-99-8', category: 'cardiovascular' },
  { name: 'Cetirizine Dihydrochloride', pnec: 6.1, casNumber: '83881-52-1', category: 'antihistamine' },
  { name: 'Azithromycin Dihydrate', pnec: 0.019, casNumber: '83905-01-5', category: 'antibiotic' },
  { name: 'Simvastatin', pnec: 0.2, casNumber: '79902-63-9', category: 'lipid-lowering' },
];

export const SITE_PRODUCTS: Record<string, string[]> = {
  'Basel Manufacturing Site': ['Metformin Hydrochloride', 'Ibuprofen', 'Amoxicillin Trihydrate', 'Paracetamol', 'Omeprazole', 'Losartan Potassium'],
  'Dublin API Facility': ['Diclofenac Sodium', 'Atorvastatin Calcium', 'Ciprofloxacin HCl', 'Amoxicillin Trihydrate', 'Azithromycin Dihydrate', 'Simvastatin'],
  'Singapore Packaging Center': ['Paracetamol', 'Cetirizine Dihydrochloride', 'Ibuprofen', 'Omeprazole', 'Losartan Potassium'],
  'Munich R&D Lab': ['Metformin Hydrochloride', 'Simvastatin', 'Atorvastatin Calcium', 'Cetirizine Dihydrochloride'],
};

export const SUBSTANCE_CATEGORY_LABELS: Record<SubstanceCategory, string> = {
  antibiotic: 'Antibiotics',
  analgesic: 'Analgesics / NSAIDs',
  cardiovascular: 'Cardiovascular',
  gastrointestinal: 'Gastrointestinal',
  antihistamine: 'Antihistamines',
  'lipid-lowering': 'Lipid-Lowering',
  antidiabetic: 'Antidiabetics',
};

// ── Substance builder ──
function makeSub(
  id: string, inn: string, cas: string, pnec: number, pnecSource: string, category: SubstanceCategory,
  amountPerBatch: number, batchesPerYear: number, lossPerBatch: number,
  remSolid: number, remPre: number, remWWT: number,
  wwFlow: number, treatRate: number, measured: number | null, dilution: number,
  noConcern = false, riskComment = ''
): DrugSubstance {
  return calculateSubstanceMetrics({
    id, inn, casNumber: cas, pnecValue: pnec, pnecSource, category,
    pbtClassification: 'none', biodegradable: true,
    noEnvironmentalConcern: noConcern, lastReviewDate: '2025-01-15',
    amountPerBatch, batchesPerWeek: Math.ceil(batchesPerYear / 50),
    batchesPerYear, batchesPerCampaign: Math.ceil(batchesPerYear / 4),
    lossPerBatch, lossPerCampaign: lossPerBatch * Math.ceil(batchesPerYear / 4),
    removalSolidWaste: remSolid, removalPreTreatment: remPre, removalWWT: remWWT,
    eliminationSolidWaste: remSolid, eliminationPreTreatment: remPre,
    eliminationEvidence: remPre > 0 ? 'Pre-treatment documentation' : '',
    wastewaterFlow: wwFlow, treatmentEliminationRate: treatRate,
    effluentFlow: wwFlow * 0.96, measuredConcentration: measured, dilutionFactor: dilution,
    riskComment,
  });
}

// ── Quarters ──
export const AVAILABLE_QUARTERS = [
  { year: 2025, quarter: 1, label: 'Q1 2025' },
  { year: 2024, quarter: 4, label: 'Q4 2024' },
  { year: 2024, quarter: 3, label: 'Q3 2024' },
  { year: 2024, quarter: 2, label: 'Q2 2024' },
  { year: 2024, quarter: 1, label: 'Q1 2024' },
];

export const CURRENT_QUARTER = { year: 2025, quarter: 1, label: 'Q1 2025' };

// ── One assessment per site per quarter ──
export const mockAssessments: Assessment[] = [
  // ═══ Q1 2025 ═══
  // Basel – signed-off (fully complete)
  {
    id: 'RA-2025-001', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q1 2025',
    revision: 2, status: 'signed-off', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2025-01-15', lastModified: '2025-03-20',
    formulaVersion: 'v2.1', calculationVersion: 'v2.1',
    substances: [
      makeSub('b1','Metformin Hydrochloride','1115-70-4',10,'FASS 2024','antidiabetic', 250,200,0.5, 10,5,0, 500,0,null,10),
      makeSub('b2','Ibuprofen','15687-27-1',1.65,'EMA ERA','analgesic', 100,150,0.2, 5,0,15, 500,85,0.3,10),
      makeSub('b3','Amoxicillin Trihydrate','61336-70-7',0.078,'Ecotox Lit','antibiotic', 80,100,0.15, 3,2,10, 500,40,0.05,10, false, 'Approaching threshold - monitoring'),
    ],
    exempt: false, comments: 'Annual review completed.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, attachments: mockAttachments['RA-2025-001'],
    siteConstants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
    reviewStarted: true,
  },
  // Dublin – pending-review, non-compliant, review started
  {
    id: 'RA-2025-002', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 3', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'pending-review', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2025-01-20', lastModified: '2025-03-05',
    formulaVersion: 'v2.1', calculationVersion: 'v2.1',
    substances: [
      makeSub('d1','Diclofenac Sodium','15307-79-6',0.05,'EU Watch List','analgesic', 50,90,0.3, 5,10,5, 500,30,0.15,8, false, 'CAPA initiated for Diclofenac'),
      makeSub('d2','Atorvastatin Calcium','134523-03-8',0.12,'Published Lit','lipid-lowering', 30,80,0.05, 2,0,0, 500,0,null,8),
      makeSub('d3','Ciprofloxacin HCl','86393-32-0',0.089,'EMA','antibiotic', 45,110,0.12, 3,5,8, 500,50,0.04,8, false, 'Elevated but within range'),
    ],
    exempt: false, comments: 'Diclofenac flagged – CAPA initiated.', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false, attachments: mockAttachments['RA-2025-002'],
    siteConstants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
    reviewStarted: true,
  },
  // Singapore – draft
  {
    id: 'RA-2025-003', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Packaging & Distribution', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'draft', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2025-01-25', lastModified: '2025-03-18',
    formulaVersion: 'v2.1', calculationVersion: 'v2.1',
    substances: [
      makeSub('s1','Paracetamol','103-90-2',9.2,'ECHA','analgesic', 500,250,0.1, 0,0,0, 300,0,null,6, true),
      makeSub('s2','Cetirizine Dihydrochloride','83881-52-1',6.1,'FDA','antihistamine', 30,80,0.04, 0,0,0, 300,0,null,6),
    ],
    exempt: false, comments: '', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false, attachments: mockAttachments['RA-2025-003'],
    siteConstants: { retentionTime: 12, flowToWWT: 300, exitFlowWWT: 288, receivingWaterFlow: 25, dilutionFactor: 6, manualDilution: true },
  },
  // Munich – approved (exempt)
  {
    id: 'RA-2025-004', siteName: 'Munich R&D Lab',
    operationalUnit: 'Analytical Laboratory', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'approved', owner: 'Dr. Thomas Braun', siteHSEO: 'Anna Winkler',
    createdDate: '2025-02-01', lastModified: '2025-03-30',
    formulaVersion: 'v2.1', calculationVersion: 'v2.1',
    substances: [],
    exempt: true, exemptJustification: 'No process wastewater discharge. All waste handled via contracted hazardous waste disposal.',
    comments: 'Exempt – no wastewater pathway.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, attachments: mockAttachments['RA-2025-004'],
    siteConstants: { retentionTime: 8, flowToWWT: 100, exitFlowWWT: 96, receivingWaterFlow: 40, dilutionFactor: 12, manualDilution: false },
    reviewStarted: true,
  },

  // ═══ Q4 2024 ═══
  {
    id: 'RA-2024-010', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q4 2024',
    revision: 3, status: 'signed-off', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2024-10-05', lastModified: '2024-12-20',
    formulaVersion: 'v2.0', calculationVersion: 'v2.0',
    substances: [
      makeSub('b1q4','Metformin Hydrochloride','1115-70-4',10,'FASS 2024','antidiabetic', 240,190,0.45, 10,5,0, 500,0,null,10),
      makeSub('b2q4','Ibuprofen','15687-27-1',1.65,'EMA ERA','analgesic', 95,140,0.18, 5,0,15, 500,85,0.28,10),
    ],
    exempt: false, comments: 'Q4 assessment signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
  },
  {
    id: 'RA-2024-011', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 5', reportingPeriod: 'Q4 2024',
    revision: 2, status: 'signed-off', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2024-10-01', lastModified: '2024-12-20',
    formulaVersion: 'v2.0', calculationVersion: 'v2.0',
    substances: [
      makeSub('d4','Azithromycin Dihydrate','83905-01-5',0.019,'WHO EML','antibiotic', 20,60,0.08, 2,3,5, 500,60,0.01,8),
      makeSub('d5','Simvastatin','79902-63-9',0.2,'ECHA','lipid-lowering', 35,75,0.06, 4,0,0, 500,45,null,8),
    ],
    exempt: false, comments: 'Q4 review signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
  },
  {
    id: 'RA-2024-012', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Secondary Packaging', reportingPeriod: 'Q4 2024',
    revision: 1, status: 'signed-off', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2024-10-10', lastModified: '2024-12-15',
    formulaVersion: 'v2.0', calculationVersion: 'v2.0',
    substances: [
      makeSub('s3','Ibuprofen','15687-27-1',1.65,'EMA ERA','analgesic', 100,100,0.15, 5,0,10, 300,0,null,6),
      makeSub('s4','Omeprazole','73590-58-6',4.5,'ECHA','gastrointestinal', 60,90,0.08, 0,0,0, 300,0,null,6),
    ],
    exempt: false, comments: 'Signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 12, flowToWWT: 300, exitFlowWWT: 288, receivingWaterFlow: 25, dilutionFactor: 6, manualDilution: true },
  },
  {
    id: 'RA-2024-013', siteName: 'Munich R&D Lab',
    operationalUnit: 'Analytical Laboratory', reportingPeriod: 'Q4 2024',
    revision: 1, status: 'signed-off', owner: 'Dr. Thomas Braun', siteHSEO: 'Anna Winkler',
    createdDate: '2024-10-05', lastModified: '2024-12-18',
    formulaVersion: 'v2.0', calculationVersion: 'v2.0',
    substances: [],
    exempt: true, exemptJustification: 'No process wastewater discharge.',
    comments: 'Exempt.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 8, flowToWWT: 100, exitFlowWWT: 96, receivingWaterFlow: 40, dilutionFactor: 12, manualDilution: false },
  },

  // ═══ Q3 2024 ═══
  {
    id: 'RA-2024-007', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q3 2024',
    revision: 2, status: 'signed-off', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2024-07-10', lastModified: '2024-09-28',
    formulaVersion: 'v1.5', calculationVersion: 'v1.5',
    substances: [
      makeSub('b1q3','Metformin Hydrochloride','1115-70-4',10,'FASS 2024','antidiabetic', 230,185,0.42, 10,5,0, 500,0,null,10),
      makeSub('b3q3','Amoxicillin Trihydrate','61336-70-7',0.078,'Ecotox Lit','antibiotic', 75,95,0.14, 3,2,10, 500,40,0.04,10),
    ],
    exempt: false, comments: 'Q3 signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
  },
  {
    id: 'RA-2024-008', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 3', reportingPeriod: 'Q3 2024',
    revision: 1, status: 'signed-off', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2024-07-15', lastModified: '2024-09-25',
    formulaVersion: 'v1.5', calculationVersion: 'v1.5',
    substances: [
      makeSub('d1q3','Diclofenac Sodium','15307-79-6',0.05,'EU Watch List','analgesic', 48,85,0.28, 5,10,5, 500,30,0.12,8, false, 'Persistent non-compliance'),
      makeSub('d3q3','Ciprofloxacin HCl','86393-32-0',0.089,'EMA','antibiotic', 42,100,0.11, 3,5,8, 500,50,0.03,8),
    ],
    exempt: false, comments: 'Diclofenac remains non-compliant.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
  },
  {
    id: 'RA-2024-009', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Packaging & Distribution', reportingPeriod: 'Q3 2024',
    revision: 1, status: 'signed-off', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2024-07-20', lastModified: '2024-09-30',
    formulaVersion: 'v1.5', calculationVersion: 'v1.5',
    substances: [
      makeSub('s1q3','Paracetamol','103-90-2',9.2,'ECHA','analgesic', 480,240,0.09, 0,0,0, 300,0,null,6, true),
      makeSub('s2q3','Cetirizine Dihydrochloride','83881-52-1',6.1,'FDA','antihistamine', 28,75,0.03, 0,0,0, 300,0,null,6),
    ],
    exempt: false, comments: 'All compliant.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 12, flowToWWT: 300, exitFlowWWT: 288, receivingWaterFlow: 25, dilutionFactor: 6, manualDilution: true },
  },

  // ═══ Q2 2024 ═══
  {
    id: 'RA-2024-004', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q2 2024',
    revision: 1, status: 'signed-off', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2024-04-05', lastModified: '2024-06-25',
    formulaVersion: 'v1.5', calculationVersion: 'v1.5',
    substances: [
      makeSub('b1q2','Metformin Hydrochloride','1115-70-4',10,'FASS 2024','antidiabetic', 220,180,0.4, 10,5,0, 500,0,null,10),
    ],
    exempt: false, comments: 'Q2 signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
  },
  {
    id: 'RA-2024-005', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 3', reportingPeriod: 'Q2 2024',
    revision: 1, status: 'signed-off', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2024-04-10', lastModified: '2024-06-20',
    formulaVersion: 'v1.5', calculationVersion: 'v1.5',
    substances: [
      makeSub('d1q2','Diclofenac Sodium','15307-79-6',0.05,'EU Watch List','analgesic', 45,80,0.25, 5,10,5, 500,30,0.10,8, false, 'Ongoing CAPA'),
    ],
    exempt: false, comments: 'Diclofenac non-compliant.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
  },

  // ═══ Q1 2024 ═══
  {
    id: 'RA-2024-001', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q1 2024',
    revision: 2, status: 'signed-off', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2024-01-10', lastModified: '2024-03-28',
    formulaVersion: 'v1.0', calculationVersion: 'v1.0',
    substances: [
      makeSub('b1q1','Metformin Hydrochloride','1115-70-4',10,'FASS 2024','antidiabetic', 210,175,0.38, 10,5,0, 500,0,null,10),
      makeSub('b2q1','Ibuprofen','15687-27-1',1.65,'EMA ERA','analgesic', 90,130,0.17, 5,0,15, 500,85,0.25,10),
    ],
    exempt: false, comments: 'Q1 2024 signed off.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
  },
  {
    id: 'RA-2024-002', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 3', reportingPeriod: 'Q1 2024',
    revision: 1, status: 'signed-off', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2024-01-15', lastModified: '2024-03-22',
    formulaVersion: 'v1.0', calculationVersion: 'v1.0',
    substances: [
      makeSub('d1q1','Diclofenac Sodium','15307-79-6',0.05,'EU Watch List','analgesic', 42,75,0.22, 5,10,5, 500,30,0.08,8, false, 'Flagged'),
      makeSub('d2q1','Atorvastatin Calcium','134523-03-8',0.12,'Published Lit','lipid-lowering', 28,70,0.04, 2,0,0, 500,0,null,8),
    ],
    exempt: false, comments: 'Diclofenac flagged.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
  },
  {
    id: 'RA-2024-003', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Packaging & Distribution', reportingPeriod: 'Q1 2024',
    revision: 1, status: 'signed-off', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2024-01-20', lastModified: '2024-03-25',
    formulaVersion: 'v1.0', calculationVersion: 'v1.0',
    substances: [
      makeSub('s1q1','Paracetamol','103-90-2',9.2,'ECHA','analgesic', 450,220,0.08, 0,0,0, 300,0,null,6, true),
    ],
    exempt: false, comments: 'Compliant.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false, reviewStarted: true,
    siteConstants: { retentionTime: 12, flowToWWT: 300, exitFlowWWT: 288, receivingWaterFlow: 25, dilutionFactor: 6, manualDilution: true },
  },
];

export function getQuarterFromPeriod(period: string): { year: number; quarter: number } | null {
  const match = period.match(/Q(\d)\s+(\d{4})/);
  if (!match) return null;
  return { quarter: parseInt(match[1]), year: parseInt(match[2]) };
}

export function filterByQuarter(assessments: Assessment[], year: number | null, quarter: number | null): Assessment[] {
  if (year === null && quarter === null) return assessments;
  return assessments.filter(a => {
    const q = getQuarterFromPeriod(a.reportingPeriod);
    if (!q) return false;
    if (year !== null && q.year !== year) return false;
    if (quarter !== null && q.quarter !== quarter) return false;
    return true;
  });
}

export const defaultChecklist: ChecklistItem[] = [
  { id: 'c1', text: 'All drug substances handled at the site have been identified', completed: false, category: 'Substance Inventory' },
  { id: 'c2', text: 'PNEC data reviewed and updated', completed: false, category: 'Eco-Toxicological Data' },
  { id: 'c3', text: 'Worst-case production data verified', completed: false, category: 'Process Data' },
  { id: 'c4', text: 'Wastewater treatment parameters documented', completed: false, category: 'Wastewater' },
  { id: 'c5', text: 'Dilution factors justified', completed: false, category: 'Environmental' },
  { id: 'c6', text: 'Elimination claims supported with evidence', completed: false, category: 'Evidence' },
  { id: 'c7', text: 'Non-compliant substances have CAPAs', completed: false, category: 'Actions' },
  { id: 'c8', text: 'Responsibilities assigned', completed: false, category: 'Actions' },
  { id: 'c9', text: 'Special reuse flags reviewed', completed: false, category: 'Special Conditions' },
  { id: 'c10', text: 'Assessment ready for review', completed: false, category: 'Final Review' },
];
