import { Assessment, DrugSubstance, ChecklistItem, calculateSubstanceMetrics } from '@/types/assessment';

// ── Products with PNEC data ──
export interface ProductInfo {
  name: string;
  pnec: number;
  casNumber: string;
}

export const ALL_PRODUCTS: ProductInfo[] = [
  { name: 'Metformin Hydrochloride', pnec: 10, casNumber: '1115-70-4' },
  { name: 'Ibuprofen', pnec: 1.65, casNumber: '15687-27-1' },
  { name: 'Amoxicillin Trihydrate', pnec: 0.078, casNumber: '61336-70-7' },
  { name: 'Paracetamol', pnec: 9.2, casNumber: '103-90-2' },
  { name: 'Diclofenac Sodium', pnec: 0.05, casNumber: '15307-79-6' },
  { name: 'Omeprazole', pnec: 4.5, casNumber: '73590-58-6' },
  { name: 'Atorvastatin Calcium', pnec: 0.12, casNumber: '134523-03-8' },
  { name: 'Ciprofloxacin HCl', pnec: 0.089, casNumber: '86393-32-0' },
  { name: 'Losartan Potassium', pnec: 3.8, casNumber: '124750-99-8' },
  { name: 'Cetirizine Dihydrochloride', pnec: 6.1, casNumber: '83881-52-1' },
  { name: 'Azithromycin Dihydrate', pnec: 0.019, casNumber: '83905-01-5' },
  { name: 'Simvastatin', pnec: 0.2, casNumber: '79902-63-9' },
];

// ── Site → product mapping ──
export const SITE_PRODUCTS: Record<string, string[]> = {
  'Basel Manufacturing Site': [
    'Metformin Hydrochloride', 'Ibuprofen', 'Amoxicillin Trihydrate',
    'Paracetamol', 'Omeprazole', 'Losartan Potassium',
  ],
  'Dublin API Facility': [
    'Diclofenac Sodium', 'Atorvastatin Calcium', 'Ciprofloxacin HCl',
    'Amoxicillin Trihydrate', 'Azithromycin Dihydrate', 'Simvastatin',
  ],
  'Singapore Packaging Center': [
    'Paracetamol', 'Cetirizine Dihydrochloride', 'Ibuprofen',
    'Omeprazole', 'Losartan Potassium',
  ],
  'Munich R&D Lab': [
    'Metformin Hydrochloride', 'Simvastatin', 'Atorvastatin Calcium',
    'Cetirizine Dihydrochloride',
  ],
};

// ── Helper to build a substance ──
function makeSub(
  id: string, inn: string, cas: string, pnec: number, pnecSource: string,
  amountPerBatch: number, batchesPerYear: number, lossPerBatch: number,
  elimSolid: number, elimPre: number, wwFlow: number, treatRate: number,
  measured: number | null, dilution: number, noConcern = false
): DrugSubstance {
  return calculateSubstanceMetrics({
    id, inn, casNumber: cas, pnecValue: pnec, pnecSource,
    pbtClassification: 'none', biodegradable: true,
    noEnvironmentalConcern: noConcern, lastReviewDate: '2025-09-15',
    amountPerBatch, batchesPerWeek: Math.ceil(batchesPerYear / 50),
    batchesPerYear, batchesPerCampaign: Math.ceil(batchesPerYear / 4),
    lossPerBatch, eliminationSolidWaste: elimSolid, eliminationPreTreatment: elimPre,
    eliminationEvidence: elimPre > 0 ? 'Pre-treatment documentation' : '',
    wastewaterFlow: wwFlow, treatmentEliminationRate: treatRate,
    effluentFlow: wwFlow * 0.96, measuredConcentration: measured, dilutionFactor: dilution,
  });
}

// ── Mock assessments (multiple per site) ──
export const mockAssessments: Assessment[] = [
  // Basel
  {
    id: 'RA-2025-001', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Solid Dosage Forms – Building A', reportingPeriod: 'Q1 2025',
    revision: 2, status: 'approved', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2025-01-15', lastModified: '2025-03-20',
    substances: [
      makeSub('b1','Metformin Hydrochloride','1115-70-4',10,'FASS 2024',250,200,0.5,10,5,500,0,null,10),
      makeSub('b2','Ibuprofen','15687-27-1',1.65,'EMA ERA',100,150,0.2,5,0,500,85,0.3,10),
      makeSub('b3','Amoxicillin Trihydrate','61336-70-7',0.078,'Ecotox Lit',80,100,0.15,3,2,500,40,0.05,10),
    ],
    exempt: false, comments: 'Annual review completed.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false,
  },
  {
    id: 'RA-2025-005', siteName: 'Basel Manufacturing Site',
    operationalUnit: 'Liquid Formulations – Building C', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'draft', owner: 'Dr. Elena Fischer', siteHSEO: 'Markus Steiner',
    createdDate: '2025-02-10', lastModified: '2025-03-15',
    substances: [
      makeSub('b4','Omeprazole','73590-58-6',4.5,'ECHA',60,120,0.1,5,0,400,0,null,10),
      makeSub('b5','Losartan Potassium','124750-99-8',3.8,'FDA ERA',40,90,0.08,0,0,400,0,null,10),
    ],
    exempt: false, comments: '', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false,
  },
  // Dublin
  {
    id: 'RA-2025-002', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 3', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'pending-review', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2025-01-20', lastModified: '2025-03-05',
    substances: [
      makeSub('d1','Diclofenac Sodium','15307-79-6',0.05,'EU Watch List',50,90,0.3,5,10,500,30,0.15,10),
      makeSub('d2','Atorvastatin Calcium','134523-03-8',0.12,'Published Lit',30,80,0.05,2,0,500,0,null,10),
      makeSub('d3','Ciprofloxacin HCl','86393-32-0',0.089,'EMA',45,110,0.12,3,5,500,50,0.04,10),
    ],
    exempt: false, comments: 'Diclofenac flagged – CAPA initiated.', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false,
  },
  {
    id: 'RA-2025-006', siteName: 'Dublin API Facility',
    operationalUnit: 'API Synthesis – Unit 5', reportingPeriod: 'Q4 2024',
    revision: 2, status: 'approved', owner: "Sarah O'Brien", siteHSEO: 'Patrick Nolan',
    createdDate: '2024-10-01', lastModified: '2024-12-20',
    substances: [
      makeSub('d4','Azithromycin Dihydrate','83905-01-5',0.019,'WHO EML',20,60,0.08,2,3,500,60,0.01,10),
      makeSub('d5','Simvastatin','79902-63-9',0.2,'ECHA',35,75,0.06,4,0,500,45,null,10),
    ],
    exempt: false, comments: 'Q4 review approved.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false,
  },
  // Singapore
  {
    id: 'RA-2025-003', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Packaging & Distribution', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'draft', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2025-01-25', lastModified: '2025-03-18',
    substances: [
      makeSub('s1','Paracetamol','103-90-2',9.2,'ECHA',500,250,0.1,0,0,500,0,null,10,true),
      makeSub('s2','Cetirizine Dihydrochloride','83881-52-1',6.1,'FDA',30,80,0.04,0,0,500,0,null,10),
    ],
    exempt: false, comments: '', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false,
  },
  {
    id: 'RA-2025-007', siteName: 'Singapore Packaging Center',
    operationalUnit: 'Secondary Packaging', reportingPeriod: 'Q4 2024',
    revision: 1, status: 'approved', owner: 'Wei Lin Tan', siteHSEO: 'Raj Patel',
    createdDate: '2024-10-10', lastModified: '2024-12-15',
    substances: [
      makeSub('s3','Ibuprofen','15687-27-1',1.65,'EMA ERA',100,100,0.15,5,0,400,0,null,10),
    ],
    exempt: false, comments: 'Approved.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false,
  },
  // Munich
  {
    id: 'RA-2025-004', siteName: 'Munich R&D Lab',
    operationalUnit: 'Analytical Laboratory', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'approved', owner: 'Dr. Thomas Braun', siteHSEO: 'Anna Winkler',
    createdDate: '2025-02-01', lastModified: '2025-03-30',
    substances: [],
    exempt: true, exemptJustification: 'No process wastewater discharge. All waste handled via contracted hazardous waste disposal.',
    comments: 'Exempt – no wastewater pathway.', checklistComplete: true,
    reuseWastewater: false, reuseSludge: false,
  },
  {
    id: 'RA-2025-008', siteName: 'Munich R&D Lab',
    operationalUnit: 'Formulation Lab', reportingPeriod: 'Q1 2025',
    revision: 1, status: 'pending-review', owner: 'Dr. Thomas Braun', siteHSEO: 'Anna Winkler',
    createdDate: '2025-02-15', lastModified: '2025-03-25',
    substances: [
      makeSub('m1','Simvastatin','79902-63-9',0.2,'ECHA',10,30,0.02,0,0,100,0,null,10),
      makeSub('m2','Atorvastatin Calcium','134523-03-8',0.12,'Published Lit',8,25,0.01,0,0,100,0,null,10),
    ],
    exempt: false, comments: 'Small-scale R&D batches.', checklistComplete: false,
    reuseWastewater: false, reuseSludge: false,
  },
];

export const defaultChecklist: ChecklistItem[] = [
  { id: 'c1', text: 'All drug substances handled at the site have been identified and included', completed: false, category: 'Substance Inventory' },
  { id: 'c2', text: 'Current PNEC data has been reviewed and updated where necessary', completed: false, category: 'Eco-Toxicological Data' },
  { id: 'c3', text: 'Worst-case production data has been verified for all substances', completed: false, category: 'Process Data' },
  { id: 'c4', text: 'Wastewater treatment parameters are current and documented', completed: false, category: 'Wastewater' },
  { id: 'c5', text: 'Receiving water body data and dilution factors are appropriate and justified', completed: false, category: 'Environmental' },
  { id: 'c6', text: 'All elimination claims are supported with uploaded evidence', completed: false, category: 'Evidence' },
  { id: 'c7', text: 'Non-compliant substances have CAPAs initiated and documented', completed: false, category: 'Actions' },
  { id: 'c8', text: 'Responsibilities have been assigned for all required actions', completed: false, category: 'Actions' },
  { id: 'c9', text: 'Special reuse flags (irrigation/sludge) have been reviewed', completed: false, category: 'Special Conditions' },
  { id: 'c10', text: 'Assessment is ready for review and approval', completed: false, category: 'Final Review' },
];
