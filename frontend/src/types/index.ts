export type RiskCategory = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type HazardId = 'flash_flood' | 'landslide' | 'waterlogging' | 'soil_erosion' | 'ground_motion';
export type SensorKey = 'rainfall' | 'soil_moisture' | 'water_level' | 'ground_tilt' | 'vibration' | 'temperature' | 'humidity';
export type DeviceHealth = 'online' | 'offline' | 'degraded';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'WATCH' | 'WARNING' | 'CRITICAL';
export type Mode = 'demo' | 'live';
export type Trend = 'increasing' | 'stable' | 'decreasing';
export interface Site { id: string; name: string; location: string; latitude: number; longitude: number; deployment: 'Hillside / slope' | 'River / stream' | 'Urban drainage'; deviceStatus: DeviceHealth; lastUpdated: string; isDemo?: boolean; hazardScores?: Partial<Record<HazardId, number>>; }
export interface SensorReading { key: SensorKey; label: string; value: number | null; unit: string; previous: number | null; timestamp: string | null; health: DeviceHealth | 'stale' | 'invalid'; siteId: string; }
export interface Point { timestamp: string; value: number; }
export interface HazardRisk { id: HazardId; score: number | null; category: RiskCategory | null; trend: Trend; factors: string[]; recommendation: string; updatedAt: string | null; completeness: number | null; source: string; history: Point[]; }
export interface AlertItem { id: string; hazard: HazardId; severity: AlertSeverity; siteId: string; riskScore: number; createdAt: string; status: AlertStatus; deliveryStatus: 'not_configured' | 'pending' | 'delivered' | 'failed' | 'simulated'; explanation: string; action: string; factors: string[]; acknowledgedAt?: string; resolvedAt?: string; simulated?: boolean; }
export interface EventItem { id: string; type: string; time: string; siteId: string; hazard?: HazardId; severity?: string; description: string; source: 'demo' | 'api'; }
export interface DeviceItem { id: string; name: string; siteId: string; status: DeviceHealth; lastSeen: string; firmware?: string; }
export interface WeatherContext { status: 'available' | 'unavailable' | 'demo'; summary: string; source: string; updatedAt: string | null; }
export interface Snapshot { sites: Site[]; sensors: SensorReading[]; hazards: Record<HazardId, HazardRisk>; alerts: AlertItem[]; events: EventItem[]; devices: DeviceItem[]; weather: WeatherContext; updatedAt: string | null; dataSource: string; }
export interface Scenario { id: string; name: string; subtitle: string; }
export interface AppSettings { apiBaseUrl: string; intervalSec: number; compact: boolean; motion: boolean; }
