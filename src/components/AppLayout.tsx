import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Shield,
  Menu,
  X,
  Globe,
  Building2,
  Bell,
  Settings,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSiteContext, SITES } from '@/contexts/SiteContext';
import { mockAssessments, CURRENT_QUARTER, filterByQuarter } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectedSite, setSelectedSite, isGlobalView } = useSiteContext();

  const notifications = useMemo(() => {
    const current = filterByQuarter(mockAssessments, CURRENT_QUARTER.year, CURRENT_QUARTER.quarter);
    const items: { id: string; title: string; description: string; link: string; type: 'action' | 'review' }[] = [];

    if (isGlobalView) {
      current.filter(a => a.status === 'pending-review').forEach(a => {
        items.push({
          id: a.id, title: `Review: ${a.siteName}`,
          description: `${a.id} · ${a.reportingPeriod} awaiting approval`,
          link: `/assessment/${a.id}`, type: 'review',
        });
      });
    } else {
      current.filter(a => a.siteName === selectedSite && (a.status === 'draft' || a.status === 'not-started')).forEach(a => {
        items.push({
          id: a.id, title: 'Complete Assessment',
          description: `${a.id} · ${a.operationalUnit} needs data entry`,
          link: '/assessment-summary', type: 'action',
        });
      });
    }
    return items;
  }, [isGlobalView, selectedSite]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/assessments', label: 'Assessments', icon: FileText, show: true },
    { to: '/assessment-summary', label: 'Assessment Summary', icon: ClipboardCheck, show: !isGlobalView },
    { to: '/admin', label: 'Admin', icon: Settings, show: isGlobalView },
  ];

  const visibleNav = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <button className="mr-3 lg:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
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
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to}
                  className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-popover z-50" align="end">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {notifications.length === 0 ? "You're all caught up!" : `${notifications.length} action${notifications.length > 1 ? 's' : ''} required`}
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <Link key={n.id} to={n.link}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                      <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', n.type === 'review' ? 'bg-warning' : 'bg-primary')} />
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              {isGlobalView ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Building2 className="h-4 w-4 text-primary" />}
              <Select value={selectedSite ?? '__global__'} onValueChange={(v) => setSelectedSite(v === '__global__' ? null : v as any)}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="__global__">
                    <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Global View</span>
                  </SelectItem>
                  {SITES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {isGlobalView ? 'MS' : 'EF'}
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden border-b border-border bg-card p-2">
          {visibleNav.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                location.pathname === item.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              )}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}
