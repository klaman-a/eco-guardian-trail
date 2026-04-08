export interface AuditEvent {
  id: string;
  assessmentId: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: 'status' | 'edit' | 'approval' | 'comment' | 'attachment';
}

export interface AuditFinding {
  id: string;
  assessmentId: string;
  timestamp: string;
  auditor: string;
  severity: 'observation' | 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export const mockAuditTrail: AuditEvent[] = [
  { id: 'at-001', assessmentId: 'RA-2025-001', timestamp: '2025-01-10 09:15', user: 'E. Fischer', action: 'Assessment Created', details: 'New assessment initiated for Q1 2025', category: 'status' },
  { id: 'at-002', assessmentId: 'RA-2025-001', timestamp: '2025-01-15 14:30', user: 'E. Fischer', action: 'Data Entry', details: 'Added 6 substances with production data', category: 'edit' },
  { id: 'at-003', assessmentId: 'RA-2025-001', timestamp: '2025-01-22 10:00', user: 'E. Fischer', action: 'Attachment Uploaded', details: 'Ibuprofen_Ecotox_Data.xlsx uploaded', category: 'attachment' },
  { id: 'at-004', assessmentId: 'RA-2025-001', timestamp: '2025-02-15 11:20', user: 'E. Fischer', action: 'Submitted', details: 'Assessment submitted for review', category: 'status' },
  { id: 'at-005', assessmentId: 'RA-2025-001', timestamp: '2025-02-18 09:45', user: 'M. Schmidt', action: 'Review Started', details: 'Review initiated by M. Schmidt', category: 'approval' },
  { id: 'at-006', assessmentId: 'RA-2025-001', timestamp: '2025-02-20 16:00', user: 'M. Schmidt', action: 'Approved', details: 'Assessment approved after review', category: 'approval' },
  { id: 'at-007', assessmentId: 'RA-2025-001', timestamp: '2025-02-22 10:30', user: 'Dr. K. Weber', action: 'Signed Off', details: 'Final sign-off by site head', category: 'status' },

  { id: 'at-008', assessmentId: 'RA-2025-002', timestamp: '2025-01-12 08:00', user: 'S. Murphy', action: 'Assessment Created', details: 'New assessment initiated for Q1 2025', category: 'status' },
  { id: 'at-009', assessmentId: 'RA-2025-002', timestamp: '2025-01-20 13:45', user: 'S. Murphy', action: 'Data Entry', details: 'Added 6 substances incl. Diclofenac & Cipro', category: 'edit' },
  { id: 'at-010', assessmentId: 'RA-2025-002', timestamp: '2025-02-10 15:20', user: 'S. Murphy', action: 'Attachment Uploaded', details: 'Cipro_Elimination_Evidence.pdf', category: 'attachment' },
  { id: 'at-011', assessmentId: 'RA-2025-002', timestamp: '2025-02-28 10:00', user: 'S. Murphy', action: 'Submitted', details: 'Assessment submitted for review', category: 'status' },
  { id: 'at-012', assessmentId: 'RA-2025-002', timestamp: '2025-03-02 09:30', user: 'M. Schmidt', action: 'Review Started', details: 'Review initiated', category: 'approval' },

  { id: 'at-013', assessmentId: 'RA-2025-003', timestamp: '2025-01-08 10:00', user: 'L. Tan', action: 'Assessment Created', details: 'New assessment for Q1 2025', category: 'status' },
  { id: 'at-014', assessmentId: 'RA-2025-003', timestamp: '2025-01-18 11:30', user: 'L. Tan', action: 'Data Entry', details: 'Added 5 substances', category: 'edit' },
  { id: 'at-015', assessmentId: 'RA-2025-003', timestamp: '2025-02-01 14:00', user: 'L. Tan', action: 'Submitted', details: 'Assessment submitted', category: 'status' },
  { id: 'at-016', assessmentId: 'RA-2025-003', timestamp: '2025-02-05 09:00', user: 'M. Schmidt', action: 'Approved', details: 'Assessment approved', category: 'approval' },
  { id: 'at-017', assessmentId: 'RA-2025-003', timestamp: '2025-02-07 15:00', user: 'Dr. J. Lim', action: 'Signed Off', details: 'Final sign-off', category: 'status' },

  { id: 'at-018', assessmentId: 'RA-2025-004', timestamp: '2025-01-20 09:00', user: 'T. Bauer', action: 'Assessment Created', details: 'New assessment for Q1 2025', category: 'status' },
  { id: 'at-019', assessmentId: 'RA-2025-004', timestamp: '2025-02-05 11:00', user: 'T. Bauer', action: 'Data Entry', details: 'Added 4 substances', category: 'edit' },
];

export const mockAuditFindings: AuditFinding[] = [
  {
    id: 'af-001', assessmentId: 'RA-2025-002', timestamp: '2025-03-15 10:00',
    auditor: 'A. Müller', severity: 'minor',
    title: 'Incomplete elimination evidence for Ciprofloxacin',
    description: 'The uploaded elimination evidence document does not include the most recent WWT performance data from Q4 2024.',
    status: 'open',
  },
  {
    id: 'af-002', assessmentId: 'RA-2025-001', timestamp: '2025-03-10 14:30',
    auditor: 'A. Müller', severity: 'observation',
    title: 'Dilution factor source documentation',
    description: 'Recommend adding reference to the hydrological study used for the receiving water flow value.',
    status: 'acknowledged',
  },
];

export function getAuditTrail(assessmentId: string): AuditEvent[] {
  return mockAuditTrail.filter(e => e.assessmentId === assessmentId);
}

export function getAuditFindings(assessmentId: string): AuditFinding[] {
  return mockAuditFindings.filter(f => f.assessmentId === assessmentId);
}
