import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, CloudRain, Database, Info, ShieldAlert, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { usePrism } from '../context/PrismContext';
import type { HazardId, Point } from '../types';
import { ApiClient } from '../services/api/client';
import { fmtDate, fmtValue, hazardKeys, hazardNames, riskColor, sensorNames } from '../utils';
import { PageHeading, Panel, Select, StatusBadge, Tag, TrendMark, Empty } from '../components/common/UI';
import { HorizontalBar, TrendChart } from '../components/charts/Charts';

export function RiskAnalysis() {
  const { data, mode, siteId, settings } = usePrism(); const [q, setQ] = useSearchParams();
  const initial = hazardKeys.includes(q.get('hazard') as HazardId) ? q.get('hazard') as HazardId : 'flash_flood';
  const [hazard, setHazard] = useState<HazardId>(initial); const selected = data.hazards[hazard];
  const [liveHistory, setLiveHistory] = useState<Point[]>([]);
  const [historyMessage, setHistoryMessage] = useState('');
  useEffect(() => {
    if (mode !== 'live') { setLiveHistory([]); setHistoryMessage(''); return; }
    const controller = new AbortController(); setLiveHistory([]); setHistoryMessage('');
    const params = new URLSearchParams({ hazard_type: hazard, site_id: siteId });
    new ApiClient(settings.apiBaseUrl).request(`/api/v1/risk/history?${params}`, controller.signal)
      .then(raw => {
        if (controller.signal.aborted) return;
        const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
        const arr = Array.isArray(raw) ? raw : obj.items ?? obj.history ?? obj.data;
        setLiveHistory(Array.isArray(arr) ? arr.flatMap(x => {
          if (!x || typeof x !== 'object') return [];
          const item = x as Record<string, unknown>;
          const timestamp = item.timestamp ?? item.recorded_at;
          const value = item.value ?? item.score ?? item.risk_score;
          return typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp)) && typeof value === 'number' && Number.isFinite(value) ? [{ timestamp, value }] : [];
        }) : []);
      }).catch(() => { if (!controller.signal.aborted) setHistoryMessage('Historical risk endpoint unavailable or unrecognized.'); });
    return () => controller.abort();
  }, [mode, hazard, siteId, settings.apiBaseUrl]);
  const setHazardSelection = (h: HazardId) => { setHazard(h); setQ({ hazard: h }); };
  const sensorSubset = data.sensors.filter(s => s.siteId === siteId && (hazard === 'flash_flood' ? ['rainfall','water_level','soil_moisture'] : hazard === 'landslide' ? ['soil_moisture','ground_tilt','rainfall'] : hazard === 'waterlogging' ? ['rainfall','water_level'] : hazard === 'ground_motion' ? ['vibration','ground_tilt'] : ['rainfall','soil_moisture']).includes(s.key));
  return <div className="space-y-5"><PageHeading eyebrow="HAZARD MODELS / EXPLAINABILITY" title="Risk Analysis" description="Transparent prototype hazard assessments with contributing measurements, temporal changes and recommended next actions." action={<Select label="Choose hazard" value={hazard} onChange={v => setHazardSelection(v as HazardId)} options={hazardKeys.map(h => ({ value: h, label: hazardNames[h] }))}/>}/>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{hazardKeys.map(h => { const r = data.hazards[h]; return <button onClick={() => setHazardSelection(h)} key={h} className={`hazard-selector ${hazard === h ? 'selected' : ''}`}><div className="text-xs text-muted font-medium">{hazardNames[h]}</div><div className="mt-3 flex items-center gap-2"><span className="text-2xl font-semibold text-white">{r.score ?? '—'}</span><span className="w-2 h-2 rounded-full" style={{ background: riskColor(r.category) }}/></div><div className="mt-2"><StatusBadge status={r.category} small/></div></button>; })}</div>
    <div className="grid lg:grid-cols-12 gap-4"><Panel className="lg:col-span-4" title="Current hazard assessment" icon={<ShieldAlert size={16}/>} action={<StatusBadge status={selected.category}/> }><div className="my-8 text-center"><div className="inline-flex items-baseline gap-1"><span className="text-7xl tracking-tight font-semibold text-white">{selected.score ?? '—'}</span><span className="text-muted">/100</span></div><div className="section-eyebrow mt-3">{hazardNames[hazard]} risk index</div></div><div className="risk-meter h-2.5 mb-4"><div style={{ width: `${selected.score ?? 0}%`, background: riskColor(selected.category) }}/></div><div className="grid grid-cols-2 gap-3 text-[11px]"><div className="text-muted">Trajectory <div className="mt-1"><TrendMark trend={selected.trend}/></div></div><div className="text-muted">Data completeness <div className="text-white mt-1 font-semibold">{selected.completeness == null ? 'Unavailable' : `${selected.completeness}%`}</div></div><div className="text-muted">Last assessed <div className="text-slate-200 mt-1">{fmtDate(selected.updatedAt)}</div></div><div className="text-muted">Data source <div className="text-slate-200 mt-1">{mode === 'demo' ? 'Simulated' : 'Backend API'}</div></div></div></Panel>
      <Panel className="lg:col-span-8" title={`${hazardNames[hazard]} risk history`} subtitle="Temporal change of the selected hazard score" icon={<TrendingUp size={16}/>}>{historyMessage && <p className="text-[11px] text-amber-300 mb-3">{historyMessage}</p>}<TrendChart data={mode === 'live' && liveHistory.length ? liveHistory : selected.history} color={riskColor(selected.category)} height={285} suffix=" / 100"/></Panel></div>
    <div className="grid lg:grid-cols-12 gap-4"><Panel className="lg:col-span-7" title="Why is this risk level assigned?" subtitle="Explainable evidence · only supported by currently available readings" icon={<Info size={16}/>}>
      {selected.factors.length ? <div className="space-y-2">{selected.factors.map((s,i) => <div key={i} className="factor-row"><div className="rounded-lg bg-cyan/10 p-2 text-cyan"><Activity size={15}/></div><span className="text-[12px] text-slate-200 grow">{s}</span><Tag tone="blue">INPUT</Tag></div>)}</div> : <Empty description="The API has not returned evidence for this risk score."/>}
      <div className="mt-4 rounded-xl bg-[#10263a] border border-[#264052] p-4"><div className="flex gap-2 items-center text-[12px] font-semibold text-slate-200"><Database size={14} className="text-cyan"/> External context</div><p className="text-[11px] text-muted mt-2 leading-5">Weather: {data.weather.status} · {data.weather.summary} Terrain: unavailable unless supplied by backend. Satellite-derived data: not integrated.</p></div>
    </Panel><Panel className="lg:col-span-5" title="Operational guidance" subtitle="Prototype decision support · not an official warning" icon={<SlidersHorizontal size={16}/>}><div className="rounded-xl bg-[#1b2e3e] border-l-[3px] border-cyan p-4"><p className="section-eyebrow">RECOMMENDED NEXT ACTION</p><p className="text-[13px] text-white leading-6 mt-3">{selected.recommendation}</p></div><p className="text-[11px] text-muted leading-5 mt-4"><ShieldAlert size={12} className="inline mr-1 text-amber-300"/>The risk scores and model weights are not field-calibrated. Ground-motion anomalies must never be presented as reliable earthquake forecasts.</p><div className="mt-4 pt-3 border-t border-border text-[11px] text-muted">Source: {selected.source}</div></Panel></div>
    <div className="grid lg:grid-cols-12 gap-4"><Panel className="lg:col-span-6" title="Relevant ground telemetry" subtitle="Latest readings at selected monitoring site" icon={<Activity size={16}/>}><div className="space-y-2">{sensorSubset.length ? sensorSubset.map(s => <div className="factor-row" key={s.key}><span className="grow text-xs text-muted">{sensorNames[s.key]}</span><strong className="text-white text-sm">{fmtValue(s.value)} <span className="text-xs font-normal text-muted">{s.unit}</span></strong><Tag tone={s.health === 'online' ? 'green' : 'yellow'}>{s.health}</Tag></div>) : <Empty/>}</div></Panel><Panel className="lg:col-span-6" title="Cross-hazard comparison" subtitle="Scoring across five monitored hazards" icon={<CloudRain size={16}/>}><HorizontalBar data={hazardKeys.filter(h => data.hazards[h].score !== null).map(h => ({ name: hazardNames[h], value: data.hazards[h].score! }))}/></Panel></div>
    <div className="flex items-center gap-2 text-[11px] text-muted"><ArrowRight size={13}/> Model thresholds are demonstrative: NORMAL 0–30, WATCH 31–50, WARNING 51–75, CRITICAL 76–100. No unsupported confidence percentages are displayed.</div>
  </div>;
}
