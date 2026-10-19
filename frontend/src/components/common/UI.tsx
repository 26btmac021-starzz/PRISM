import { Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, Clock3, Database, Download, Minus, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';
import type { HazardRisk, SensorReading, Trend } from '../../types';
import { categoryClass, fmtDate, fmtValue, hazardNames, riskColor } from '../../utils';
import { usePrism } from '../../context/PrismContext';
import type { ReactNode } from 'react';

export function Panel({ title, subtitle, icon, action, children, className = '' }: { title?: string; subtitle?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>
    {(title || action) && <div className="panel-heading"><div className="min-w-0"><div className="flex items-center gap-2">{icon && <span className="text-cyan">{icon}</span>}{title && <h2 className="text-[14px] font-semibold tracking-[.01em] text-slate-100">{title}</h2>}</div>{subtitle && <p className="mt-1 text-[11px] text-muted">{subtitle}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>}
    {children}
  </section>;
}
export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><div className="section-eyebrow">{eyebrow}</div><h1 className="text-[27px] md:text-[32px] font-semibold tracking-tight text-white mt-1">{title}</h1><p className="text-[13px] text-muted mt-1 max-w-3xl">{description}</p></div>{action && <div className="flex items-center gap-2 flex-wrap">{action}</div>}</header>;
}
export function StatusBadge({ status, small = false }: { status: string | null | undefined; small?: boolean }) {
  return <span className={`status-pill ${categoryClass(status)} ${small ? 'pill-small' : ''}`}><i className="status-dot" />{status || 'UNKNOWN'}</span>;
}
export function Tag({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'yellow' | 'red' | 'muted' }) { return <span className={`tag tag-${tone}`}>{children}</span>; }
export function Button({ children, onClick, variant = 'secondary', disabled = false, title, className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; title?: string; className?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={title} className={`btn btn-${variant} ${className}`}>{children}</button>;
}
export function Select({ value, onChange, options, label, className = '' }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label?: string; className?: string }) {
  return <label className={`relative inline-flex items-center min-w-0 ${className}`}>{label && <span className="sr-only">{label}</span>}<select className="control pr-8 appearance-none w-full" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 text-muted" size={14}/></label>;
}
export function ModeRibbon() { const { mode, scenario } = usePrism(); return mode === 'demo' ? <div className="demo-ribbon"><span className="inline-flex items-center gap-1 font-bold tracking-wider"><Database size={13}/> DEMONSTRATION MODE</span><span>Simulated scenario: {scenario.replace(/_/g,' ')}. Not for operational emergency decisions.</span></div> : <div className="live-ribbon"><ShieldAlert size={13}/> LIVE MODE · Unvalidated prototype. Verify backend data and official warnings.</div>; }
export function Empty({ title = 'No data available', description = 'The selected source has no readings for this view.', icon }: { title?: string; description?: string; icon?: ReactNode }) { return <div className="empty-state">{icon || <Database size={26}/>}<h3>{title}</h3><p>{description}</p></div>; }
export function LoadingState() { return <div className="animate-pulse space-y-3 p-4"><div className="h-5 bg-slate-700/40 rounded w-1/2"/><div className="h-28 bg-slate-700/30 rounded"/><div className="h-5 bg-slate-700/40 rounded w-2/3"/></div>; }
export function ErrorNotice() { const { error, mode, refresh, loading } = usePrism(); if (!error) return null; return <div className="error-notice"><AlertCircle size={16} className="shrink-0"/><span>{error} {mode === 'live' && 'Missing endpoints are not replaced with fabricated data.'}</span><Button variant="ghost" onClick={() => void refresh()} disabled={loading}><RefreshCw size={13}/> Retry</Button></div>; }
export function TrendMark({ trend }: { trend: Trend }) { const upward = trend === 'increasing'; return <span className={`inline-flex items-center gap-1 text-[11px] ${upward ? 'text-[#f7a44b]' : trend === 'decreasing' ? 'text-emerald-400' : 'text-muted'}`}>{upward ? <ArrowUpRight size={13}/> : trend === 'decreasing' ? <ArrowDownRight size={13}/> : <Minus size={13}/>} {trend}</span>; }
export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) { return <div className="stat-box"><div className="flex justify-between items-center text-muted"><span className="text-xs">{label}</span>{icon}</div><div className="text-[23px] text-white font-semibold mt-3 tracking-tight">{value}</div>{hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}</div>; }
export function SensorTile({ sensor, miniChart, onClick }: { sensor: SensorReading; miniChart?: ReactNode; onClick?: () => void }) {
  const missing = sensor.value == null; const delta = sensor.value != null && sensor.previous != null ? sensor.value - sensor.previous : null;
  return <button type="button" onClick={onClick} className="sensor-tile text-left group"><div className="flex items-start justify-between gap-2"><span className="text-xs text-muted">{sensor.label}</span><span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${sensor.health === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} title={`Sensor: ${sensor.health}`}/></div>
    <div className="flex justify-between items-end mt-3 gap-1"><div><div className="text-[25px] font-semibold tracking-tight text-white">{fmtValue(sensor.value, sensor.key === 'vibration' ? 2 : 1)} <span className="text-xs font-medium text-muted">{sensor.unit}</span></div><div className="text-[10px] text-muted mt-1">{missing ? 'Reading unavailable' : delta === null ? 'No comparison' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} vs previous`} · {sensor.health}</div></div><div className="w-20 h-11 shrink-0">{miniChart}</div></div>
    <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] text-muted flex items-center justify-between"><span>Latest reading</span><span>{fmtDate(sensor.timestamp, { hour: '2-digit', minute: '2-digit' })}</span></div>
  </button>;
}
export function HazardCard({ risk, onOpen }: { risk: HazardRisk; onOpen: () => void }) {
  const color = riskColor(risk.category); return <div className="hazard-card" style={{ borderTopColor: color }}><div className="flex items-center justify-between gap-2"><div className="font-semibold text-[13px] text-slate-100">{hazardNames[risk.id]}</div><StatusBadge status={risk.category} small/></div><div className="flex items-center gap-4 mt-4"><span className="text-3xl font-semibold tracking-tight text-white">{risk.score ?? '—'}</span><div className="grow"><div className="flex items-center justify-between text-[10px] text-muted mb-2"><span>RISK INDEX</span><TrendMark trend={risk.trend}/></div><div className="risk-meter"><div style={{ width: `${risk.score ?? 0}%`, backgroundColor: color }}/></div></div></div><p className="line-clamp-2 text-[11px] leading-5 text-muted mt-4 min-h-[40px]">{risk.factors.length ? risk.factors.slice(0,2).join(' · ') : 'Awaiting contributing factors'}</p><button onClick={onOpen} className="mt-2 flex items-center gap-1 text-xs text-cyan group-hover:opacity-90">Explore risk analysis <ArrowRight size={13}/></button></div>;
}
export function Freshness({ stamp }: { stamp: string | null }) { if (!stamp) return <span className="inline-flex items-center gap-1 text-amber-300"><WifiOff size={12}/> No reading</span>; return <span className="inline-flex items-center gap-1 text-muted"><Clock3 size={12}/>{fmtDate(stamp)}</span>; }
export function DownloadCSV({ onClick }: { onClick: () => void }) { return <Button onClick={onClick}><Download size={14}/> Export CSV</Button>; }
export function SuccessLine({ children }: { children: ReactNode }) { return <span className="text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 size={14}/>{children}</span>; }
export function HeadingEyebrow({ children }: { children: ReactNode }) { return <div className="section-eyebrow mb-2 flex items-center gap-2"><Activity size={13}/>{children}</div>; }
