import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Shield,
  Menu,
  X,
  Globe,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import { useSiteContext, SITES } from '@/contexts/SiteContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectedSite, setSelectedSite, isGlobalView } = useSiteContext();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, always: true },
    { to: '/assessments', label: 'Assessments', icon: FileText, always: true },
    { to: '/new-assessment', label: 'New Assessment', icon: Plus, always: false },
  ];

  const visibleNav = navItems.filter(item => item.always || !isGlobalView);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <button
            className="mr-3 lg:hidden text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">ISD Effluent Risk</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Assessment Platform</p>
            </div>
          </div>

          <nav className="ml-8 hidden lg:flex items-center gap-1">
            {visibleNav.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Site / Global switcher */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isGlobalView ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Building2 className="h-4 w-4 text-primary" />
              )}
              <Select
                value={selectedSite ?? '__global__'}
                onValueChange={(v) => setSelectedSite(v === '__global__' ? null : v as any)}
              >
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="__global__">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> Global View
                    </span>
                  </SelectItem>
                  {SITES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              EF
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-card p-2">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {children}
      </main>
    </div>
  );
}
