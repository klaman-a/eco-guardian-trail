import { createContext, useContext, useState, ReactNode } from 'react';
import { SiteConstants } from '@/types/assessment';

export const SITES = [
  'Basel Manufacturing Site',
  'Dublin API Facility',
  'Singapore Packaging Center',
  'Munich R&D Lab',
] as const;

export type SiteName = typeof SITES[number];

export interface SiteMetadata {
  name: SiteName;
  type: 'manufacturing' | 'api' | 'packaging' | 'rnd';
  geoArea: 'Europe' | 'Asia Pacific';
  constants: SiteConstants;
}

export const SITE_METADATA: Record<SiteName, SiteMetadata> = {
  'Basel Manufacturing Site': {
    name: 'Basel Manufacturing Site',
    type: 'manufacturing',
    geoArea: 'Europe',
    constants: { retentionTime: 24, flowToWWT: 500, exitFlowWWT: 480, receivingWaterFlow: 50, dilutionFactor: 10, manualDilution: false },
  },
  'Dublin API Facility': {
    name: 'Dublin API Facility',
    type: 'api',
    geoArea: 'Europe',
    constants: { retentionTime: 18, flowToWWT: 450, exitFlowWWT: 430, receivingWaterFlow: 35, dilutionFactor: 8, manualDilution: false },
  },
  'Singapore Packaging Center': {
    name: 'Singapore Packaging Center',
    type: 'packaging',
    geoArea: 'Asia Pacific',
    constants: { retentionTime: 12, flowToWWT: 300, exitFlowWWT: 288, receivingWaterFlow: 25, dilutionFactor: 6, manualDilution: true },
  },
  'Munich R&D Lab': {
    name: 'Munich R&D Lab',
    type: 'rnd',
    geoArea: 'Europe',
    constants: { retentionTime: 8, flowToWWT: 100, exitFlowWWT: 96, receivingWaterFlow: 40, dilutionFactor: 12, manualDilution: false },
  },
};

export const SITE_TYPE_LABELS: Record<string, string> = {
  manufacturing: 'Manufacturing',
  api: 'API Facility',
  packaging: 'Packaging',
  rnd: 'R&D Lab',
};

interface SiteContextType {
  selectedSite: SiteName | null;
  setSelectedSite: (site: SiteName | null) => void;
  isGlobalView: boolean;
}

const SiteContext = createContext<SiteContextType>({
  selectedSite: null,
  setSelectedSite: () => {},
  isGlobalView: true,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<SiteName | null>(null);

  return (
    <SiteContext.Provider value={{ selectedSite, setSelectedSite, isGlobalView: selectedSite === null }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSiteContext() {
  return useContext(SiteContext);
}
