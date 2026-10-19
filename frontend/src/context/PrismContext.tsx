import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AlertItem, AppSettings, EventItem, Mode, Snapshot } from '../types';
import { ApiClient, emptySnapshot } from '../services/api/client';
import { makeDemo, scenarios } from '../services/demo/data';
import { readSetting } from '../utils';

interface PrismContextShape {
  mode: Mode; setMode: (mode: Mode) => void; scenario: string; setScenario: (scenario: string) => void;
  data: Snapshot; siteId: string; setSiteId: (id: string) => void;
  settings: AppSettings; setSettings: (partial: Partial<AppSettings>) => void;
  loading: boolean; error: string | null; failures: string[]; connected: boolean; lastSuccessfulSync: string | null;
  refresh: () => Promise<void>; acknowledgeAlert: (id: string) => void; resolveAlert: (id: string) => void; triggerTestAlert: () => void;
}
const Context = createContext<PrismContextShape | undefined>(undefined);
export const usePrism = () => { const ctx = useContext(Context); if (!ctx) throw new Error('PRISM provider missing'); return ctx; };
export function PrismProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => readSetting('prism.mode', 'demo'));
  const [scenario, setScenarioState] = useState(() => readSetting('prism.scenario', 'rain'));
  const [settings, setSettingsState] = useState<AppSettings>(() => readSetting('prism.settings', {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', intervalSec: 15, compact: false, motion: true,
  }));
  const [data, setData] = useState<Snapshot>(() => mode === 'demo' ? makeDemo(scenario) : emptySnapshot());
  const [siteId, setSiteId] = useState(() => readSetting('prism.site', 'SITE-001'));
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<string | null>(null);
  const requestId = useRef(0);
  const setMode = useCallback((next: Mode) => { requestId.current++; setModeState(next); setData(next === 'demo' ? makeDemo(scenario) : emptySnapshot()); setConnected(false); setError(null); setFailures([]); }, [scenario]);
  const setScenario = useCallback((next: string) => { if (!scenarios.some(s => s.id === next)) return; setScenarioState(next); setData(makeDemo(next)); setError(null); }, []);
  const setSettings = useCallback((partial: Partial<AppSettings>) => setSettingsState(s => ({ ...s, ...partial })), []);
  useEffect(() => { localStorage.setItem('prism.mode', JSON.stringify(mode)); }, [mode]);
  useEffect(() => { localStorage.setItem('prism.scenario', JSON.stringify(scenario)); }, [scenario]);
  useEffect(() => { localStorage.setItem('prism.site', JSON.stringify(siteId)); }, [siteId]);
  useEffect(() => { localStorage.setItem('prism.settings', JSON.stringify(settings)); document.documentElement.dataset.compact = String(settings.compact); document.documentElement.dataset.motion = String(settings.motion); }, [settings]);
  useEffect(() => { if (data.sites.length && !data.sites.some(s => s.id === siteId)) setSiteId(data.sites[0].id); }, [data.sites, siteId]);
  const refresh = useCallback(async () => {
    if (mode === 'demo') { setData(prev => ({ ...prev, updatedAt: new Date().toISOString() })); setLastSuccessfulSync(new Date().toISOString()); return; }
    const id = ++requestId.current; setLoading(true); setError(null);
    try {
      const client = new ApiClient(settings.apiBaseUrl); const ok = await client.ping();
      if (id !== requestId.current) return; setConnected(ok);
      if (!ok) throw new Error('Backend health check failed. No simulated fallback has been applied.');
      const result = await client.getSnapshot();
      if (id !== requestId.current) return;
      setData(result.data); setFailures(result.failures); setLastSuccessfulSync(new Date().toISOString());
      if (result.failures.length) setError(`${result.failures.length} backend endpoint(s) unavailable or not yet implemented.`);
    } catch (e) { if (id === requestId.current) { setError(e instanceof Error ? e.message : 'Backend request failed'); setConnected(false); } }
    finally { if (id === requestId.current) setLoading(false); }
  }, [mode, settings.apiBaseUrl]);
  useEffect(() => { if (mode !== 'live') return; void refresh(); const handle = window.setInterval(() => void refresh(), Math.max(5, settings.intervalSec) * 1000); return () => { window.clearInterval(handle); requestId.current++; }; }, [mode, settings.intervalSec, refresh]);
  // Optional WebSocket push: any event triggers a typed HTTP refresh. The payload is
  // never guessed because the backend's stream schema has not been provided.
  useEffect(() => {
    if (mode !== 'live' || !/^https?:\/\//.test(settings.apiBaseUrl)) return;
    let socket: WebSocket | null = null;
    let debounce: number | undefined;
    try {
      const url = `${settings.apiBaseUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/api/v1/ws/live`;
      socket = new WebSocket(url);
      socket.onmessage = () => { if (debounce) window.clearTimeout(debounce); debounce = window.setTimeout(() => void refresh(), 700); };
      socket.onerror = () => socket?.close(); // Existing interval polling remains active.
    } catch { /* WebSocket endpoint is optional. */ }
    return () => { if (debounce) window.clearTimeout(debounce); if (socket) { socket.onmessage = null; socket.onerror = null; socket.close(); } };
  }, [mode, settings.apiBaseUrl, refresh]);
  const updateAlert = (id: string, status: 'acknowledged' | 'resolved') => {
    if (mode !== 'demo') return; const now = new Date().toISOString();
    setData(prev => { const alert = prev.alerts.find(a => a.id === id); if (!alert || alert.status === 'resolved' || alert.status === status) return prev;
      const alerts: AlertItem[] = prev.alerts.map(a => a.id === id ? ({ ...a, status, acknowledgedAt: status === 'acknowledged' ? now : a.acknowledgedAt, resolvedAt: status === 'resolved' ? now : a.resolvedAt }) : a);
      const evt: EventItem = { id: `EVT-${Date.now()}-${id}`, type: status === 'acknowledged' ? 'Alert acknowledged' : 'Alert resolved', time: now, siteId: alert.siteId, hazard: alert.hazard, severity: alert.severity, description: `${id} ${status} in demo mode`, source: 'demo' };
      return { ...prev, alerts, events: [evt, ...prev.events] }; });
  };
  const triggerTestAlert = () => { if (mode !== 'demo') return; const now = new Date().toISOString(); const id = `SIM-TEST-${Date.now()}`;
    setData(prev => { const alert: AlertItem = { id, hazard: 'flash_flood', siteId: prev.sites[0]?.id ?? 'SITE-001', riskScore: 58, createdAt: now, status: 'active', severity: 'WARNING', deliveryStatus: 'simulated', explanation: 'Manually triggered training alert; no emergency notification sent.', action: 'Demonstration only. No field action required.', factors: ['Test trigger from PRISM operator console'], simulated: true };
      return { ...prev, alerts: [alert, ...prev.alerts], events: [{ id: `EVT-${id}`, type: 'Alert created', time: now, siteId: alert.siteId, hazard: alert.hazard, severity: 'WARNING', description: 'Manual test alert generated (demo only)', source: 'demo' }, ...prev.events] }; });
  };
  const value = useMemo(() => ({ mode, setMode, scenario, setScenario, data, siteId, setSiteId, settings, setSettings, loading, error, failures, connected, lastSuccessfulSync, refresh, acknowledgeAlert: (id: string) => updateAlert(id, 'acknowledged'), resolveAlert: (id: string) => updateAlert(id, 'resolved'), triggerTestAlert }), [mode, setMode, scenario, setScenario, data, siteId, settings, setSettings, loading, error, failures, connected, lastSuccessfulSync, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
