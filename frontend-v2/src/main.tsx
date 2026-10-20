import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './style.css'
import { StoreProvider } from './store'
import { Shell } from './ui'
import { Alerts, Events, Monitor, Overview, Reports, Risk, Settings, StationMap } from './pages'
function Application(){return <BrowserRouter><StoreProvider><Shell><Routes><Route path="/" element={<Overview/>}/><Route path="/monitor" element={<Monitor/>}/><Route path="/risk" element={<Risk/>}/><Route path="/map" element={<StationMap/>}/><Route path="/reports" element={<Reports/>}/><Route path="/events" element={<Events/>}/><Route path="/alerts" element={<Alerts/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Overview/>}/></Routes></Shell></StoreProvider></BrowserRouter>}
createRoot(document.getElementById('root')!).render(<StrictMode><Application/></StrictMode>)
