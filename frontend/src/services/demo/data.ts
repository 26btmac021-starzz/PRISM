import type { AlertItem, DeviceItem, EventItem, HazardId, HazardRisk, Point, Scenario, SensorKey, SensorReading, Site, Snapshot } from '../../types';
import { hazardKeys, riskCategory, sensorKeys, sensorNames, sensorUnits, hazardNames } from '../../utils';

export const scenarios: Scenario[] = [
  { id: 'normal', name: 'Normal conditions', subtitle: 'All systems within baseline limits' },
  { id: 'rain', name: 'Intensifying rainfall', subtitle: 'Water levels and flood risk increasing' },
  { id: 'landslide', name: 'Slope instability', subtitle: 'Saturated soil with changing tilt' },
  { id: 'water', name: 'Urban waterlogging', subtitle: 'Drainage capacity under pressure' },
  { id: 'motion', name: 'Abnormal ground motion', subtitle: 'Anomaly detection only, not earthquake prediction' },
  { id: 'stale', name: 'Disconnected sensor', subtitle: 'Telemetry freshness failure' },
  { id: 'escalation', name: 'Risk escalation', subtitle: 'WATCH → WARNING → CRITICAL' },
  { id: 'alerts', name: 'Alert operations', subtitle: 'Practice acknowledge and resolve workflows' },
];
const baseSensor: Record<SensorKey, number> = { rainfall: 4.2, soil_moisture: 37, water_level: 1.12, ground_tilt: 1.4, vibration: 0.08, temperature: 24.6, humidity: 62 };
const scenarioReadings: Record<string, Partial<Record<SensorKey, number>>> = {
  normal: {}, rain: { rainfall: 67.8, soil_moisture: 72, water_level: 3.86, humidity: 96 },
  landslide: { rainfall: 32.4, soil_moisture: 89, ground_tilt: 9.8, vibration: 0.45, humidity: 91 },
  water: { rainfall: 76.2, water_level: 4.56, soil_moisture: 78 },
  motion: { vibration: 2.74, ground_tilt: 5.2 },
  stale: { rainfall: 14.2, soil_moisture: 55 },
  escalation: { rainfall: 93.8, water_level: 5.2, soil_moisture: 92, ground_tilt: 11.2 },
  alerts: { rainfall: 49.8, soil_moisture: 78, water_level: 3.15 },
};
const scenarioScores: Record<string, number[]> = {
  normal: [14, 18, 12, 20, 9], rain: [81, 51, 69, 47, 13],
  landslide: [49, 89, 30, 76, 48], water: [58, 28, 91, 44, 8],
  motion: [17, 38, 15, 24, 88], stale: [43, 42, 24, 30, 12],
  escalation: [96, 82, 93, 77, 57], alerts: [70, 61, 55, 41, 17],
};
const actions: Record<HazardId, string> = {
  flash_flood: 'Monitor rising water and follow local evacuation instructions if issued.',
  landslide: 'Keep clear of unstable slopes; request geotechnical inspection.',
  waterlogging: 'Avoid flooded roads and inspect drainage blockage points.',
  soil_erosion: 'Inspect exposed surfaces, runoff pathways and retaining structures.',
  ground_motion: 'Inspect device calibration and verify ground movement with independent measurements.',
};
const factors: Record<HazardId, SensorKey[]> = { flash_flood: ['rainfall', 'water_level', 'soil_moisture'], landslide: ['soil_moisture', 'ground_tilt', 'rainfall'], waterlogging: ['water_level', 'rainfall'], soil_erosion: ['rainfall', 'soil_moisture'], ground_motion: ['vibration', 'ground_tilt'] };
export const demoSiteTemplate: Site[] = [
  { id: 'SITE-001', name: 'Trikuta Slope Alpha', location: 'Katra region · demonstration', latitude: 32.992, longitude: 74.947, deployment: 'Hillside / slope', deviceStatus: 'online', lastUpdated: '', isDemo: true },
  { id: 'SITE-002', name: 'Stream Monitor Beta', location: 'Banganga area · demonstration', latitude: 32.978, longitude: 74.929, deployment: 'River / stream', deviceStatus: 'online', lastUpdated: '', isDemo: true },
  { id: 'SITE-003', name: 'Drainage Node Gamma', location: 'Jammu area · demonstration', latitude: 32.735, longitude: 74.865, deployment: 'Urban drainage', deviceStatus: 'online', lastUpdated: '', isDemo: true },
];
export const sensorHistory = (value: number | null, key: SensorKey, now: number, count = 36, stepMs = 5 * 60000): Point[] => {
  if (value == null) return [];
  const amplitude: Record<SensorKey, number> = { rainfall: 7, soil_moisture: 6, water_level: .35, ground_tilt: .4, vibration: .08, temperature: 1.1, humidity: 5 };
  return Array.from({ length: count }, (_, i) => {
    const phase = i / (count - 1);
    const slope = (phase - 1) * amplitude[key] * (value > baseSensor[key] * 1.6 ? 2 : .2);
    const wave = Math.sin(i * .71 + sensorKeys.indexOf(key)) * amplitude[key] * .22;
    return { timestamp: new Date(now - (count - i - 1) * stepMs).toISOString(), value: Math.max(0, Math.round((value + slope + wave) * 100) / 100) };
  });
};
export function makeDemo(scenarioId = 'rain', time = Date.now()): Snapshot {
  const key = scenarioScores[scenarioId] ? scenarioId : 'rain';
  const iso = new Date(time).toISOString();
  const scores = scenarioScores[key];
  const stationOffsets = [[0,0,0,0,0],[-6,-8,-10,-9,-5],[-8,-14,-2,-5,-3]];
  const sites = demoSiteTemplate.map((s, i) => ({ ...s, hazardScores: Object.fromEntries(hazardKeys.map((h,j) => [h,Math.max(0,Math.min(100,scores[j] + stationOffsets[i][j]))])) as Record<HazardId,number>, lastUpdated: key === 'stale' && i === 0 ? new Date(time - 50 * 60000).toISOString() : iso, deviceStatus: (key === 'stale' && i === 0 ? 'offline' : 'online') as Site['deviceStatus'] }));
  const measurements = { ...baseSensor, ...scenarioReadings[key] };
  const sensors: SensorReading[] = sites.flatMap((site, i) => sensorKeys.map(k => {
    const value = Math.max(0, +(measurements[k] * (i === 0 ? 1 : i === 1 ? 0.83 : 1.07)).toFixed(k === 'vibration' ? 2 : 1));
    const missing = key === 'stale' && i === 0 && (k === 'ground_tilt' || k === 'vibration');
    return { key: k, label: sensorNames[k], value: missing ? null : value, previous: missing ? null : +(value * (key === 'normal' ? .98 : .85)).toFixed(2), unit: sensorUnits[k], timestamp: missing ? null : site.lastUpdated, health: missing ? 'stale' as const : site.deviceStatus, siteId: site.id };
  }));
  const hazards = Object.fromEntries(hazardKeys.map((id, i) => {
    const score = scores[i];
    const trend = score >= 51 ? 'increasing' : 'stable';
    const related = factors[id].map(k => {
      const s = sensors.find(s => s.key === k && s.siteId === sites[0].id);
      return s?.value == null ? `${sensorNames[k]}: unavailable` : `${sensorNames[k]}: ${s.value} ${s.unit}`;
    });
    const history = Array.from({ length: 24 }, (_, j) => ({ timestamp: new Date(time - (23 - j) * 3600000).toISOString(), value: Math.min(100, Math.max(0, Math.round(score - (23 - j) * (score > 50 ? .9 : 0) + Math.sin(j * .68) * 5))) }));
    const risk: HazardRisk = { id, score, category: riskCategory(score), trend, factors: related, recommendation: actions[id], updatedAt: iso, completeness: key === 'stale' ? 72 : 100, source: 'Deterministic demonstration · unvalidated thresholds', history };
    return [id, risk];
  })) as Record<HazardId, HazardRisk>;
  const alerts: AlertItem[] = hazardKeys.filter(h => (hazards[h].score ?? 0) > 50).map((h, i) => ({
    id: `SIM-${key.toUpperCase()}-${String(i + 1).padStart(3, '0')}`, hazard: h, severity: (hazards[h].category === 'CRITICAL' ? 'CRITICAL' : 'WARNING'),
    siteId: sites[i % 3].id, riskScore: hazards[h].score!, createdAt: new Date(time - (i + 1) * 12 * 60000).toISOString(), status: 'active', deliveryStatus: 'simulated',
    explanation: `${hazardNames[h]} risk threshold reached in demonstration scenario. This is not an official warning.`, action: actions[h], factors: hazards[h].factors, simulated: true,
  }));
  const events: EventItem[] = Array.from({ length: 65 }, (_, i) => {
    const h = hazardKeys[i % 5]; const types = ['Sensor reading received', 'Risk score recalculated', 'Risk category changed', 'Device reconnected', 'Sensor anomaly detected', 'Notification attempted'];
    return { id: `EVT-${String(1200 - i)}`, type: types[i % types.length], time: new Date(time - i * 21 * 60000).toISOString(), siteId: sites[i % 3].id, hazard: h, severity: hazards[h].category ?? 'NORMAL', description: `${types[i % types.length]} · ${hazardNames[h]} · demonstration record`, source: 'demo' };
  });
  alerts.forEach(a => events.unshift({ id: `EVT-${a.id}`, type: 'Alert created', time: a.createdAt, siteId: a.siteId, hazard: a.hazard, severity: a.severity, description: `${hazardNames[a.hazard]} alert created (simulated)`, source: 'demo' }));
  if (key === 'stale') events.push({ id: 'EVT-DEVICE-DISCONNECTED', type: 'Device disconnected', time: new Date(time-3*60000).toISOString(), siteId: sites[0].id, description: 'Field station stopped reporting live readings (simulated)', severity: 'WARNING', source: 'demo' });
  if (key === 'escalation') events.push({ id: 'EVT-ALERT-ESCALATED', type: 'Alert escalated', time: new Date(time-2*60000).toISOString(), siteId: sites[0].id, hazard: 'flash_flood', severity: 'CRITICAL', description: 'Escalated from WATCH to WARNING to CRITICAL (simulated)', source: 'demo' });
  events.sort((a,b) => Date.parse(b.time) - Date.parse(a.time));
  const devices: DeviceItem[] = sites.map((s, i) => ({ id: `ESP32-${String(i + 1).padStart(3, '0')}`, name: `PRISM Field Node ${String.fromCharCode(65 + i)}`, siteId: s.id, status: s.deviceStatus, lastSeen: s.lastUpdated, firmware: 'Demo / unspecified' }));
  return { sites, sensors, hazards, alerts, events, devices, weather: { status: 'demo', summary: 'Illustrative precipitation and humidity, not a live forecast.', source: 'Deterministic demo', updatedAt: iso }, updatedAt: iso, dataSource: 'SIMULATED · PRISM demonstration' };
}
