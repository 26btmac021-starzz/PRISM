import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import type { HazardId, Site, Snapshot } from '../../types';
import { hazardKeys, hazardNames, riskCategory, riskColor, fmtValue } from '../../utils';
import 'leaflet/dist/leaflet.css';

function Recenter({ site }: { site?: Site }) { const map = useMap(); useEffect(() => { if (site) map.flyTo([site.latitude, site.longitude], Math.max(map.getZoom(), 9), { duration: .7 }); }, [site?.id]); return null; }
export function StationMap({ data, selected, onSelect, filteredSites, height = 360, interactive = true, hazard = 'all' }: { data: Snapshot; selected?: string; onSelect?: (id: string) => void; filteredSites?: Site[]; height?: number; interactive?: boolean; hazard?: HazardId | 'all' }) {
  const sites = filteredSites ?? data.sites; const selectedSite = sites.find(s => s.id === selected);
  const center = useMemo(() => data.sites.length ? [data.sites[0].latitude, data.sites[0].longitude] as [number, number] : [32.95,74.92] as [number,number], [data.sites]);
  if (!data.sites.length) return <div className="empty-chart">Map coordinates unavailable. Connect a backend providing valid latitude/longitude.</div>;
  return <div className="rounded-xl overflow-hidden border border-border relative" style={{ height }}>
    <MapContainer center={center} zoom={9} scrollWheelZoom={interactive} dragging={interactive} zoomControl={interactive} style={{ height: '100%', width: '100%', background: '#0f2530' }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      {selectedSite && interactive && <Recenter site={selectedSite}/>}
      {sites.map((site) => {
        const knownScores = (hazard === 'all' ? hazardKeys : [hazard]).map(h => site.hazardScores?.[h]).filter((score): score is number => score != null); const category = knownScores.length ? riskCategory(Math.max(...knownScores)) : null; const color = category ? riskColor(category) : '#39c9ed';
        const icon = L.divIcon({ className: 'prism-leaflet-icon', html: `<div style="width:27px;height:27px;background:${color}22;border:2px solid ${color};border-radius:50%;display:grid;place-items:center;box-shadow:0 0 0 6px ${color}22"><div style="width:8px;height:8px;border-radius:50%;background:${color}"></div></div>`, iconSize: [27,27], iconAnchor: [13,13] });
        return <Marker key={site.id} position={[site.latitude,site.longitude]} icon={icon} eventHandlers={{ click: () => onSelect?.(site.id) }}><Popup><div className="min-w-[190px] text-[#162b43]"><strong>{site.name}</strong><p className="text-xs mt-1">{site.id} · {site.location}</p><p className="text-xs">{site.deployment}</p><div className="text-xs mt-2">Station risk: <strong>{category ?? 'Unavailable'} {knownScores.length ? `(${Math.max(...knownScores)}/100)` : ''}</strong></div><div className="text-xs mt-1">{hazardKeys.map(h => `${hazardNames[h]} ${fmtValue(site.hazardScores?.[h],0)}`).join(' · ')}</div><p className="text-xs mt-1">Device: {site.deviceStatus} · Active alerts: {data.alerts.filter(a => a.siteId === site.id && a.status !== 'resolved').length}</p><p className="text-xs mt-1">{data.sensors.filter(s => s.siteId === site.id && ['rainfall','soil_moisture','water_level'].includes(s.key)).map(s => `${s.label}: ${fmtValue(s.value)} ${s.unit}`).join(' · ') || 'Sensor readings unavailable'}</p><p className="text-[10px] uppercase mt-2 font-bold">{site.isDemo ? 'SIMULATED POSITION / RISK' : 'BACKEND REPORTED LOCATION'}</p><button onClick={() => onSelect?.(site.id)} className="mt-2 underline text-xs">Select this station</button></div></Popup></Marker>;
      })}
    </MapContainer>
    <div className="map-corner">{data.sites.some(s => s.isDemo) ? 'DEMO STATION COORDINATES' : 'STATION COORDINATES FROM API'}</div>
    {!interactive && <div className="absolute inset-0 z-[400] pointer-events-none"/>}
    <div className="absolute left-3 bottom-3 z-[450] flex items-center gap-2 flex-wrap bg-[#0d1b2c]/95 border border-border rounded-md px-2 py-1.5">{(['NORMAL','WATCH','WARNING','CRITICAL'] as const).map(s => <span key={s} className="flex items-center gap-1 text-[9px] text-slate-200"><span className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor(s) }}/>{s}</span>)}</div>
  </div>;
}
