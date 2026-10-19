import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { RiskAnalysis } from './pages/RiskAnalysis';
import { MapView } from './pages/MapView';
import { Reports } from './pages/Reports';
import { EventHistory } from './pages/EventHistory';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';
import { PrismProvider } from './context/PrismContext';
export default function App() { return <BrowserRouter><PrismProvider><Routes><Route element={<AppLayout/>}><Route path="/" element={<Dashboard/>}/><Route path="/monitor" element={<LiveMonitor/>}/><Route path="/risk" element={<RiskAnalysis/>}/><Route path="/map" element={<MapView/>}/><Route path="/reports" element={<Reports/>}/><Route path="/events" element={<EventHistory/>}/><Route path="/alerts" element={<Alerts/>}/><Route path="/settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes></PrismProvider></BrowserRouter>; }
