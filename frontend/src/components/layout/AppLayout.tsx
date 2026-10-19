import { Activity, BellRing, ChartNoAxesCombined, ChevronLeft, ChevronRight, Clock3, Database, FileBarChart2, Gauge, History, MapPinned, Menu, Mountain, Radio, RefreshCw, Settings, ShieldCheck, Wifi, WifiOff, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { usePrism } from '../../context/PrismContext';
import { ErrorNotice, ModeRibbon, Select } from '../common/UI';
import { fmtDate } from '../../utils';
const nav = [
  { to: '/', name: 'Dashboard', icon: Gauge }, { to: '/monitor', name: 'Live Monitor', icon: Radio },
  { to: '/risk', name: 'Risk Analysis', icon: ChartNoAxesCombined }, { to: '/map', name: 'Map View', icon: MapPinned },
  { to: '/reports', name: 'Reports', icon: FileBarChart2 }, { to: '/events', name: 'Event History', icon: History },
  { to: '/alerts', name: 'Alerts', icon: BellRing }, { to: '/settings', name: 'Settings', icon: Settings },
];
function Logo() { return <div className="logo-mark"><div className="logo-symbol"><Mountain size={23} strokeWidth={2.2}/><Activity size={12} className="absolute bottom-1 right-1" strokeWidth={2.8}/></div><div><span className="text-white font-extrabold text-lg tracking-[.18em] block leading-[1.15]">PRISM</span><span className="text-[9px] tracking-[.11em] text-muted font-semibold">ENVIRONMENTAL INTELLIGENCE</span></div></div>; }
export function AppLayout() {
  const [mobile, setMobile] = useState(false); const [collapsed, setCollapsed] = useState(false); const [now, setNow] = useState(new Date());
  const location = useLocation(); const { mode, setMode, data, siteId, setSiteId, connected, loading, refresh } = usePrism();
  useEffect(() => { setMobile(false); }, [location.pathname]);
  useEffect(() => { const interval = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(interval); }, []);
  const count = data.alerts.filter(a => a.status !== 'resolved').length;
  return <div className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
    {mobile && <button aria-label="Close navigation overlay" className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobile(false)}/>}
    <aside className={`sidebar ${mobile ? 'show' : ''}`}><div className="sidebar-logo"><Logo/><button className="lg:hidden text-muted" onClick={() => setMobile(false)} aria-label="Close menu"><X size={20}/></button></div>
      <div className="sidebar-scroll"><p className="nav-caption">WORKSPACE</p><nav aria-label="Main navigation" className="space-y-1">{nav.map(item => <NavLink end={item.to === '/'} key={item.to} to={item.to} title={item.name} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><item.icon size={18} strokeWidth={1.9}/><span className="nav-text">{item.name}</span>{item.name === 'Alerts' && count > 0 && <span className="nav-alert-count">{count}</span>}</NavLink>)}</nav>
        <div className="sidebar-bottom"><div className="monitoring-box"><div className="flex gap-2 items-center"><span className="status-light"/><span className="text-[11px] tracking-wider font-bold text-cyan">SYSTEM OVERVIEW</span></div><p className="text-white font-semibold text-[13px] mt-3">{mode === 'demo' ? 'Simulation active' : connected ? 'Backend responding' : 'Backend disconnected'}</p><p className="text-[11px] text-muted mt-1 leading-relaxed">{mode === 'demo' ? 'Sensor readings and alerts are generated for demonstration.' : 'Live data is accepted only from configured API endpoints.'}</p><div className="flex items-center gap-2 mt-3 text-xs text-muted"><Radio size={13}/> {data.sites.length} monitoring stations</div></div><div className="flex items-center gap-2 text-[10px] text-muted px-2 mt-5"><ShieldCheck size={15} className="text-cyan"/> Team PRISM · SMVDU</div></div>
      </div><button className="sidebar-collapse" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(v => !v)}>{collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
    </aside>
    <div className="app-main"><header className="topbar"><div className="flex items-center gap-3 min-w-0"><button className="lg:hidden text-slate-200 p-1" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={22}/></button><div className="hidden sm:flex items-center gap-1 text-[12px] text-muted"><span>PRISM</span><ChevronRight size={13}/><span className="text-slate-200">{nav.find(n => n.to === location.pathname)?.name || 'Overview'}</span></div></div>
        <div className="flex gap-2 sm:gap-4 items-center ml-auto"><label className="hidden md:flex items-center gap-2 text-xs text-muted"><MapPinned size={14}/><Select value={siteId} onChange={setSiteId} options={data.sites.map(s => ({ value: s.id, label: s.name }))} label="Monitoring site" className="w-44"/></label><div className="hidden xl:flex items-center gap-1.5 text-[11px] text-muted"><Clock3 size={13}/>{now.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div><span className={`header-connection ${mode === 'demo' ? 'demo' : connected ? 'online' : 'offline'}`}>{mode === 'demo' ? <Database size={13}/> : connected ? <Wifi size={13}/> : <WifiOff size={13}/>} <span className="hidden sm:inline">{mode === 'demo' ? 'DEMO DATA' : connected ? 'CONNECTED' : 'OFFLINE'}</span></span><button className="icon-btn" onClick={() => void refresh()} disabled={loading} title="Refresh data" aria-label="Refresh data"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button><NavLink to="/alerts" aria-label={`${count} active alerts`} className="icon-btn relative"><BellRing size={17}/>{count > 0 && <span className="alert-indicator">{count}</span>}</NavLink></div>
      </header><div className="main-content"><ModeRibbon/><ErrorNotice/><Outlet/><footer className="footer"><span>PRISM Control Centre <span className="mx-2">·</span> Prototype v1.0.0 <span className="mx-2">·</span> Make-a-Thon ’26</span><span>Last snapshot: {fmtDate(data.updatedAt)} <span className="mx-2">·</span> Not a certified early warning service</span></footer></div>
    </div>
    <div className="sr-only" aria-live="polite">{mode === 'demo' ? 'Simulation active' : connected ? 'Backend connected' : 'Backend unavailable'}</div>
    <div className="fixed bottom-4 right-4 z-[1000] lg:hidden"><select aria-label="Current mode" value={mode} onChange={e => setMode(e.target.value as 'demo' | 'live')} className="control text-xs shadow-lg"><option value="demo">Demo</option><option value="live">Live</option></select></div>
  </div>;
}
