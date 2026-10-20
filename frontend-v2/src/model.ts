export type Severity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL' | 'UNKNOWN'
export type HazardId = 'flash_flood' | 'landslide' | 'urban_flood' | 'ground_motion' | 'waterlogging'
export type SensorId = 'rainfall' | 'water_level' | 'soil_moisture' | 'tilt' | 'vibration' | 'temperature' | 'humidity'
export type AlertState = 'active' | 'acknowledged' | 'resolved'
export interface Hazard { id: HazardId; name: string; score: number | null; trend: 'increasing'|'stable'|'decreasing'|'unknown'; factors: string[]; actions: string[] }
export interface Sensor { id: SensorId; name: string; value: number | null; unit: string; previous: number | null; status: 'online'|'stale'|'offline'; time: string; siteId: string }
export interface Station { id: string; name: string; location: string; deployment: string; lat: number; lng: number; status: 'online'|'stale'|'offline'; risk: number | null; freshness: string; x: number; y: number }
export interface Alert { id: string; hazard: HazardId; title: string; siteId: string; severity: Severity; time: string; state: AlertState; delivery: 'simulated'|'pending'|'unavailable'; description: string }
export interface EventItem { id: string; time: string; title: string; detail: string; kind: 'sensor'|'alert'|'system'|'operator'; severity: Severity; siteId: string }
export interface Snapshot { hazards: Hazard[]; sensors: Sensor[]; stations: Station[]; alerts: Alert[]; events: EventItem[]; updatedAt: string; series: number[]; isSimulated: boolean }
export interface Scenario { id: string; label: string; subtitle: string; hazardScores: [number,number,number,number,number]; readings: [number,number,number,number,number,number,number]; stale?: boolean }
export const HAZARD_NAMES: Record<HazardId,string> = { flash_flood:'Flash flood', landslide:'Landslide', urban_flood:'Urban flooding', ground_motion:'Ground motion', waterlogging:'Waterlogging' }
export const HAZARD_IDS: HazardId[] = ['flash_flood','landslide','urban_flood','ground_motion','waterlogging']
export const SENSOR_IDS: SensorId[] = ['rainfall','water_level','soil_moisture','tilt','vibration','temperature','humidity']
export function severity(score:number | null):Severity { return score===null?'UNKNOWN':score>75?'CRITICAL':score>50?'WARNING':score>30?'WATCH':'NORMAL' }
export function overallRisk(hazards:Hazard[]) { const valid=hazards.map(h=>h.score).filter((v):v is number=>v!==null); return valid.length? Math.max(...valid):null }
export function stamp(t:string) { const d=new Date(t); return Number.isNaN(d.getTime())?'—': d.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) }
export function timeOnly(t:string) { const d=new Date(t); return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) }
export function csvDownload(name:string, rows:Record<string,string|number|null|undefined>[]) { if(!rows.length)return; const keys=Object.keys(rows[0]); const escape=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`; const csv=[keys.join(','),...rows.map(row=>keys.map(k=>escape(row[k])).join(','))].join('\r\n'); const a=document.createElement('a'); const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500) }
