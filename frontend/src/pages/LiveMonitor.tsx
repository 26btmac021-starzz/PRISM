import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, Clock3, Radio, RefreshCw, Waves } from 'lucide-react';
import { usePrism } from '../context/PrismContext';
import { sensorHistory } from '../services/demo/data';
import type { Point, SensorKey } from '../types';
import { ago, fmtDate, fmtValue, sensorKeys, sensorNames, sensorUnits } from '../utils';
import { Button, Empty, PageHeading, Panel, Select, SensorTile, Tag } from '../components/common/UI';
import { Sparkline, TrendChart } from '../components/charts/Charts';
import { ApiClient } from '../services/api/client';

const durations: Record<string, number> = { '15m': 15, '1h': 60, '6h': 360, '24h': 1440 };
export function LiveMonitor() {
  const { data, mode, siteId, setSiteId, settings, refresh, loading, lastSuccessfulSync } = usePrism();
  const [qs] = useSearchParams(); const [key, setKey] = useState<SensorKey>(sensorKeys.includes(qs.get('sensor') as SensorKey) ? qs.get('sensor') as SensorKey : 'rainfall');
  const [range, setRange] = useState('1h'); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [remote, setRemote] = useState<Point[]>([]); const [historyError, setHistoryError] = useState('');
  const reference = data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now();
  const base = data.sensors.find(s => s.siteId === siteId && s.key === key);
  const demoPoints = useMemo(() => base && mode === 'demo' ? sensorHistory(base.value, key, reference, 289, 5 * 60000) : [], [base?.value, key, reference, mode]);
  useEffect(() => { if (mode !== 'live') { setRemote([]); setHistoryError(''); return; }
    const ctl = new AbortController(); setHistoryError(''); setRemote([]);
    const client = new ApiClient(settings.apiBaseUrl);
    const params = new URLSearchParams({ site_id: siteId, sensor_type: key });
    client.request(`/api/v1/readings/history?${params.toString()}`, ctl.signal).then(raw => {
      if (ctl.signal.aborted) return;
      const arr = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? ((raw as Record<string, unknown>).items ?? (raw as Record<string, unknown>).readings ?? (raw as Record<string, unknown>).data) : [];
      setRemote(Array.isArray(arr) ? arr.flatMap(x => { if (!x || typeof x !== 'object') return []; const o = x as Record<string, unknown>; const timestamp = o.timestamp ?? o.recorded_at; return typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp)) && typeof o.value === 'number' && Number.isFinite(o.value) ? [{ timestamp, value: o.value }] : []; }) : []);
    }).catch(e => { if (!ctl.signal.aborted) setHistoryError(e instanceof Error ? e.message : 'Historical API unavailable'); });
    return () => ctl.abort();
  }, [mode, settings.apiBaseUrl, siteId, key, data.updatedAt]);
  const all = mode === 'demo' ? demoPoints : remote;
  const filtered = all.filter(p => { const ts = new Date(p.timestamp).getTime(); if (range !== 'custom') return ts >= reference - durations[range] * 60000; return (!from || ts >= Date.parse(from)) && (!to || ts <= Date.parse(to)); });
  const values = filtered.map(p => p.value); const min = values.length ? Math.min(...values) : null, max = values.length ? Math.max(...values) : null;
  const avg = values.length ? values.reduce((a,b) => a+b, 0) / values.length : null;
  const stationSensors = data.sensors.filter(s => s.siteId === siteId);
  return <div className="space-y-5"><PageHeading eyebrow="FIELD INTELLIGENCE / TELEMETRY" title="Live Sensor Monitor" description="Inspect sensor health, recent measurements, and historical telemetry across monitoring stations." action={<Button onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh feed</Button>}/>
    <div className="filter-toolbar"><Select label="Station" value={siteId} onChange={setSiteId} options={data.sites.map(s => ({ value: s.id, label: s.name }))}/><Select label="Sensor" value={key} onChange={v => setKey(v as SensorKey)} options={sensorKeys.map(s => ({ value: s, label: sensorNames[s] }))}/><Select label="Time period" value={range} onChange={setRange} options={[...Object.keys(durations).map(v => ({ value: v, label: v === '15m' ? 'Last 15 min' : `Last ${v}` })), { value: 'custom', label: 'Custom range' }]}/>{range === 'custom' && <><input className="control" aria-label="Range start" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}/><input className="control" aria-label="Range end" type="datetime-local" value={to} onChange={e => setTo(e.target.value)}/></>}<span className="ml-auto text-[11px] text-muted flex items-center gap-1.5"><Clock3 size={13}/> Last sync: {fmtDate(lastSuccessfulSync || data.updatedAt)}</span></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><div className="stat-box"><p className="text-xs text-muted">Current reading</p><div className="stat-value">{fmtValue(base?.value)} <span className="text-sm text-muted">{base?.unit ?? sensorUnits[key]}</span></div><div className="text-[11px] text-muted mt-2">{base?.health ?? 'Unavailable'} · {base?.timestamp ? ago(base.timestamp) : 'no timestamp'}</div></div><div className="stat-box"><p className="text-xs text-muted">Minimum</p><div className="stat-value">{fmtValue(min)} <span className="text-sm text-muted">{base?.unit ?? sensorUnits[key]}</span></div><div className="text-[11px] text-muted mt-2">Within selected period</div></div><div className="stat-box"><p className="text-xs text-muted">Maximum</p><div className="stat-value">{fmtValue(max)} <span className="text-sm text-muted">{base?.unit ?? sensorUnits[key]}</span></div><div className="text-[11px] text-muted mt-2">Within selected period</div></div><div className="stat-box"><p className="text-xs text-muted">Average</p><div className="stat-value">{fmtValue(avg)} <span className="text-sm text-muted">{base?.unit ?? sensorUnits[key]}</span></div><div className="text-[11px] text-muted mt-2">{filtered.length} recorded samples</div></div></div>
    <Panel title={`${sensorNames[key]} · trend detail`} subtitle={`Source: ${mode === 'demo' ? 'deterministic simulated samples' : 'historical backend endpoint'} · ${stationSensors.find(s => s.key === key)?.siteId ?? 'unknown site'}`} icon={<Activity size={16}/>} action={base?.value != null ? <Tag tone={base.health === 'online' ? 'green' : 'yellow'}>{base.health.toUpperCase()}</Tag> : <Tag tone="yellow">NO DATA</Tag>}>{historyError && <p className="text-[11px] text-amber-300 mb-3">Historical data unavailable: {historyError}</p>}<TrendChart data={filtered} height={290} suffix={` ${base?.unit ?? ''}`}/></Panel>
    <Panel title="Sensor matrix" subtitle="Select any instrument to inspect its telemetry" icon={<Radio size={16}/>}>{stationSensors.length ? <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{stationSensors.map(s => <SensorTile key={s.key} sensor={s} miniChart={mode === 'demo' ? <Sparkline data={sensorHistory(s.value, s.key, reference, 18)}/> : undefined} onClick={() => setKey(s.key)}/>)}</div> : <Empty/>}</Panel>
    <Panel title="Reading quality & device status" subtitle="Missing values are never silently converted to zero" icon={<Waves size={16}/>}>{stationSensors.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Sensor</th><th>Value</th><th>Previous</th><th>Health</th><th>Data freshness</th><th>Quality</th></tr></thead><tbody>{stationSensors.map(s => { const age = s.timestamp ? Date.now() - new Date(s.timestamp).getTime() : Infinity; const stale = age > Math.max(settings.intervalSec * 4, 120) * 1000; return <tr key={s.key}><td className="font-semibold text-slate-200">{s.label}</td><td>{fmtValue(s.value)} {s.unit}</td><td>{fmtValue(s.previous)}</td><td><Tag tone={s.health === 'online' && !stale ? 'green' : 'yellow'}>{s.health}</Tag></td><td>{s.timestamp ? ago(s.timestamp) : 'Never'}</td><td>{s.value == null ? <span className="text-amber-300 flex items-center gap-1"><AlertTriangle size={13}/> Missing</span> : stale ? <span className="text-amber-300">Stale / delayed</span> : <span className="text-emerald-400">Received</span>}</td></tr>; })}</tbody></table></div> : <Empty title="No readings"/>}<p className="text-[11px] text-muted mt-3">Drift detection requires sensor-specific calibration and historical baselines; no drift diagnosis is fabricated by this prototype.</p></Panel>
  </div>;
}
