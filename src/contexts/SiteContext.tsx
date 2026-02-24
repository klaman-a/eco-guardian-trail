import { createContext, useContext, useState, ReactNode } from 'react';

export const SITES = [
  'Basel Manufacturing Site',
  'Dublin API Facility',
  'Singapore Packaging Center',
  'Munich R&D Lab',
] as const;

export type SiteName = typeof SITES[number];

interface SiteContextType {
  selectedSite: SiteName | null; // null = global view
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
