import type { AlertItem, DeviceItem, EventItem, HazardId, HazardRisk, SensorKey, SensorReading, Site, Snapshot } from '../../types';
import { hazardKeys, hazardNames, riskCategory, sensorKeys, sensorNames, sensorUnits } from '../../utils';

// Expected endpoint candidates only. Align these adapters with the REAL API_CONTRACT.md.
const ENDPOINTS = {
  health: '/health', status: '/api/v1/system/status', sites: '/api/v1/sites', devices: '/api/v1/devices',
  readings: '/api/v1/readings/latest', risk: '/api/v1/risk/current', alerts: '/api/v1/alerts', events: '/api/v1/events',
  summary: '/api/v1/dashboard/summary', trends: '/api/v1/dashboard/trends', map: '/api/v1/map/sites',
};
const object = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
const list = (v: unknown, names: string[] = []): unknown[] => {
  if (Array.isArray(v)) return v;
  const o = object(v);
  if (!o) return [];
  for (const k of [...names, 'items', 'results', 'data']) if (Array.isArray(o[k])) return o[k] as unknown[];
  return [];
};
const str = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const num = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const iso = (v: unknown): string | null => { const x = str(v); return x && !Number.isNaN(Date.parse(x)) ? x : null; };
const hazardId = (v: unknown): HazardId | null => hazardKeys.find(h => h === v) ?? null;
const readingId = (v: unknown): SensorKey | null => sensorKeys.find(k => k === v) ?? null;
const validSite = (x: unknown): Site | null => {
  const o = object(x); if (!o) return null;
  const id = str(o.id || o.site_id); const latitude = num(o.latitude ?? o.lat); const longitude = num(o.longitude ?? o.lon ?? o.lng);
  if (!id || latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const status = str(o.device_status || o.deviceStatus || o.status);
  const deployment = str(o.deployment);
  const rawScores = object(o.hazard_scores || o.hazardScores || o.risk_scores);
  const hazardScores = rawScores ? Object.fromEntries(hazardKeys.flatMap(h => { const score = num(rawScores[h]); return score != null && score >= 0 && score <= 100 ? [[h,score]] : []; })) as Partial<Record<HazardId,number>> : undefined;
  return { id, name: str(o.name, id), location: str(o.location || o.address, 'Location not provided'), latitude, longitude,
    deployment: deployment === 'River / stream' || deployment === 'Urban drainage' ? deployment : 'Hillside / slope',
    deviceStatus: status === 'online' || status === 'degraded' ? status : 'offline', lastUpdated: iso(o.last_updated || o.lastUpdated) ?? '', isDemo: false, hazardScores };
};
const validReading = (x: unknown): SensorReading | null => {
  const o = object(x); if (!o) return null;
  const key = readingId(o.key || o.sensor_type || o.type); if (!key) return null;
  const v = o.value; const value = v == null ? null : num(v); if (v != null && value == null) return null;
  const siteId = str(o.site_id || o.siteId); if (!siteId) return null;
  const status = str(o.health || o.status);
  return { key, label: sensorNames[key], value, previous: num(o.previous ?? o.previous_value), unit: str(o.unit, sensorUnits[key]),
    timestamp: iso(o.timestamp || o.recorded_at), health: ['online', 'offline', 'degraded', 'stale', 'invalid'].includes(status) ? status as SensorReading['health'] : 'online', siteId };
};
const validRisk = (x: unknown): HazardRisk | null => {
  const o = object(x); if (!o) return null;
  const id = hazardId(o.id || o.hazard || o.hazard_type); if (!id) return null;
  const score = num(o.score ?? o.risk_score); if (score == null || score < 0 || score > 100) return null;
  const trends = list(o.history || o.trend, ['points']).map(p => { const pt = object(p); const timestamp = pt && iso(pt.timestamp || pt.time); const value = pt && num(pt.value ?? pt.score); return timestamp && value != null ? { timestamp, value } : null; }).filter((v): v is {timestamp: string; value: number} => v !== null);
  const factorNames = Array.isArray(o.factors) ? o.factors.filter((s): s is string => typeof s === 'string') : [];
  const trend = o.trend === 'increasing' || o.trend === 'decreasing' ? o.trend : 'stable';
  return { id, score, category: riskCategory(score), trend, factors: factorNames, history: trends, updatedAt: iso(o.updated_at || o.timestamp),
    recommendation: str(o.recommendation, 'Follow local official safety instructions.'), completeness: num(o.completeness), source: str(o.source, 'Backend risk engine') };
};
const validAlert = (x: unknown): AlertItem | null => {
  const o = object(x); if (!o) return null;
  const id = str(o.id || o.alert_id), hazard = hazardId(o.hazard || o.hazard_type), siteId = str(o.site_id || o.siteId);
  const severity = str(o.severity); if (!id || !hazard || !siteId || !['WATCH','WARNING','CRITICAL'].includes(severity)) return null;
  const status = str(o.status), delivery = str(o.delivery_status);
  const action = str(o.action || o.recommended_action, 'Follow local official safety instructions.');
  return { id, hazard, siteId, severity: severity as AlertItem['severity'], riskScore: num(o.risk_score ?? o.score) ?? 0,
    createdAt: iso(o.created_at || o.createdAt) ?? '', status: ['active','acknowledged','resolved'].includes(status) ? status as AlertItem['status'] : 'active',
    deliveryStatus: ['not_configured','pending','delivered','failed'].includes(delivery) ? delivery as AlertItem['deliveryStatus'] : 'not_configured',
    explanation: str(o.explanation, `${hazardNames[hazard]} risk alert.`), factors: Array.isArray(o.factors) ? o.factors.filter((f): f is string => typeof f === 'string') : [], action,
    acknowledgedAt: iso(o.acknowledged_at) ?? undefined, resolvedAt: iso(o.resolved_at) ?? undefined, simulated: false };
};
const validEvent = (x: unknown): EventItem | null => {
  const o = object(x); if (!o) return null; const id = str(o.id || o.event_id), time = iso(o.timestamp || o.time || o.created_at);
  if (!id || !time) return null;
  return { id, time, type: str(o.type, 'Unknown event'), siteId: str(o.site_id || o.siteId), hazard: hazardId(o.hazard) ?? undefined, severity: str(o.severity), description: str(o.description), source: 'api' };
};
const validDevice = (x: unknown): DeviceItem | null => {
  const o = object(x); if (!o) return null; const id = str(o.id || o.device_id); if (!id) return null;
  return { id, name: str(o.name, id), siteId: str(o.site_id || o.siteId), status: o.status === 'online' || o.status === 'degraded' ? o.status : 'offline', lastSeen: iso(o.last_seen || o.lastSeen) ?? '', firmware: str(o.firmware) };
};
export const emptySnapshot = (): Snapshot => ({ sites: [], sensors: [], hazards: Object.fromEntries(hazardKeys.map(id => [id, {
  id, score: null, category: null, trend: 'stable', factors: [], recommendation: 'Waiting for validated risk data', updatedAt: null, completeness: null, source: 'Unavailable', history: [],
}])) as Record<HazardId, HazardRisk>, alerts: [], events: [], devices: [], weather: { status: 'unavailable', summary: 'External weather integration has not been confirmed by the backend.', source: 'Unavailable', updatedAt: null }, updatedAt: null, dataSource: 'LIVE API · unverified' });

export class ApiClient {
  constructor(private baseUrl: string) {}
  async request(path: string, signal?: AbortSignal): Promise<unknown> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8000);
    const onAbort = () => controller.abort(); signal?.addEventListener('abort', onAbort);
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return await response.json() as unknown;
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', onAbort); }
  }
  async ping(signal?: AbortSignal): Promise<boolean> { try { await this.request(ENDPOINTS.health, signal); return true; } catch { return false; } }
  async getSnapshot(signal?: AbortSignal): Promise<{ data: Snapshot; failures: string[] }> {
    const entries = Object.entries(ENDPOINTS).filter(([k]) => k !== 'health' && k !== 'status');
    const resolved = await Promise.allSettled(entries.map(([, p]) => this.request(p, signal)));
    const results: Record<string, unknown> = {}; const failures: string[] = [];
    resolved.forEach((res, index) => { const [key, path] = entries[index]; if (res.status === 'fulfilled') results[key] = res.value; else failures.push(`${path}: ${res.reason instanceof Error ? res.reason.message : 'request failed'}`); });
    if (resolved.every(x => x.status === 'rejected')) throw new Error('No backend data endpoints are reachable. Verify API base URL and CORS.');
    const out = emptySnapshot(); const summary = object(results.summary);
    out.sites = (list(results.sites, ['sites']).length ? list(results.sites, ['sites']) : list(results.map, ['sites','stations'])).map(validSite).filter((x): x is Site => x !== null);
    out.sensors = (list(results.readings, ['readings', 'sensors']).length ? list(results.readings, ['readings', 'sensors']) : list(summary?.readings, ['readings','sensors'])).map(validReading).filter((x): x is SensorReading => x !== null);
    const riskSource = results.risk ?? summary?.risk ?? summary?.hazards;
    const riskEnvelope = object(riskSource); const rawRisks = list(riskSource, ['hazards', 'risks']);
    const convertedRisks = rawRisks.length ? rawRisks : riskEnvelope ? hazardKeys.map(id => ({ ...(object(riskEnvelope[id]) ?? {}), id })) : [];
    convertedRisks.map(validRisk).forEach(risk => { if (risk) out.hazards[risk.id] = risk; });
    out.alerts = (list(results.alerts, ['alerts']).length ? list(results.alerts, ['alerts']) : list(summary?.alerts, ['alerts'])).map(validAlert).filter((x): x is AlertItem => x !== null);
    out.events = (list(results.events, ['events']).length ? list(results.events, ['events']) : list(summary?.events, ['events'])).map(validEvent).filter((x): x is EventItem => x !== null);
    out.devices = list(results.devices, ['devices']).map(validDevice).filter((x): x is DeviceItem => x !== null);
    const weather = object(summary?.weather);
    if (weather && (weather.status === 'available' || weather.status === 'unavailable')) out.weather = { status: weather.status, summary: str(weather.summary, 'Backend reported external feed status.'), source: str(weather.source, 'Backend'), updatedAt: iso(weather.updated_at) };
    const updatedTimes = [iso(summary?.updated_at), ...out.sensors.map(s=>s.timestamp)].filter((v):v is string => !!v);
    out.updatedAt = updatedTimes.length ? updatedTimes.sort().at(-1)! : null;
    out.dataSource = 'LIVE API · validated backend fields';
    return { data: out, failures };
  }
}
