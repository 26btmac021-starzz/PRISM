import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { loadLive } from './api'
import { buildDemo, SCENARIOS } from './demo'
import { overallRisk, type Alert, type EventItem, type Snapshot } from './model'
type Mode='demo'|'live';type Density='comfortable'|'compact'
interface Store {
 mode:Mode;setMode:(m:Mode)=>void; scenario:string;chooseScenario:(id:string)=>void; apiBase:string;setApiBase:(s:string)=>void;
 refreshSeconds:number;setRefreshSeconds:(n:number)=>void;density:Density;setDensity:(d:Density)=>void;
 focusSite:string;setFocusSite:(s:string)=>void; snapshot:Snapshot; risk:number|null; refreshing:boolean; error:string;
 refresh:()=>void;acknowledge:(id:string)=>void;resolve:(id:string)=>void;testAlert:()=>void
}
const StoreContext=createContext<Store|null>(null)
function stored(key:string,def:string){try{return localStorage.getItem(key)??def}catch{return def}}
export function StoreProvider({children}:PropsWithChildren){
 const [mode,setMode]=useState<Mode>(()=>stored('prism-mode','demo')==='live'?'live':'demo')
 const [scenario,setScenario]=useState(()=>stored('prism-scenario','rainfall'))
 const [apiBase,setApiBase]=useState(()=>stored('prism-api',import.meta.env.VITE_API_BASE_URL||'http://localhost:8000'))
 const [refreshSeconds,setRefreshSeconds]=useState(()=>Number(stored('prism-interval','30'))||30)
 const [density,setDensity]=useState<Density>(()=>stored('prism-density','comfortable')==='compact'?'compact':'comfortable')
 const [focusSite,setFocusSite]=useState(()=>stored('prism-site','all'))
 const [iteration,setIteration]=useState(0)
 const [liveSnapshot,setLiveSnapshot]=useState<Snapshot|null>(null)
 const [refreshing,setRefreshing]=useState(false)
 const [error,setError]=useState('')
 const [changes,setChanges]=useState<Record<string,Alert['state']>>({})
 const [addedAlerts,setAddedAlerts]=useState<Alert[]>([])
 const [addedEvents,setAddedEvents]=useState<EventItem[]>([])
 const demo=useMemo(()=>buildDemo(scenario),[scenario,iteration])
 const snapshot=useMemo<Snapshot>(()=>{
  if(mode==='live')return liveSnapshot||{hazards:[],sensors:[],stations:[],alerts:[],events:[],updatedAt:'',series:[],isSimulated:false}
  return {...demo,alerts:[...addedAlerts,...demo.alerts.map(a=>({...a,state:changes[a.id]||a.state}))],events:[...addedEvents,...demo.events]}
 },[mode,liveSnapshot,demo,changes,addedAlerts,addedEvents])
 const refresh=()=>setIteration(i=>i+1)
 useEffect(()=>{for(const [key,value] of Object.entries({'prism-mode':mode,'prism-scenario':scenario,'prism-api':apiBase,'prism-interval':String(refreshSeconds),'prism-density':density,'prism-site':focusSite})){try{localStorage.setItem(key,value)}catch{ /* private browsing */ }}},[mode,scenario,apiBase,refreshSeconds,density,focusSite])
 useEffect(()=>{if(mode!=='live'){setError('');setRefreshing(false);return}let cancelled=false;async function poll(){setRefreshing(true);try{const result=await loadLive(apiBase);if(!cancelled){setLiveSnapshot(result);setError('')}}catch(e){if(!cancelled){setLiveSnapshot(null);setError(e instanceof Error?e.message:'Backend unavailable')}}finally{if(!cancelled)setRefreshing(false)}}poll();const interval=setInterval(poll,Math.max(10,refreshSeconds)*1000);return()=>{cancelled=true;clearInterval(interval)}},[mode,apiBase,refreshSeconds,iteration])
 function chooseScenario(id:string){if(!SCENARIOS.some(s=>s.id===id))return;setScenario(id);setChanges({});setAddedAlerts([]);setAddedEvents([])}
 function recordAlert(id:string,state:Alert['state']){if(mode!=='demo')return;const alert=snapshot.alerts.find(x=>x.id===id);if(!alert)return;setChanges(c=>({...c,[id]:state}));setAddedAlerts(a=>a.map(x=>x.id===id?{...x,state}:x));setAddedEvents(prev=>[{id:`EV-C-${Date.now()}`,time:new Date().toISOString(),title:`Alert ${state}`,detail:`${alert.title} — simulated operator action`,kind:'operator',severity:alert.severity,siteId:alert.siteId},...prev])}
 function testAlert(){if(mode!=='demo')return;const id=`TEST-${Date.now()}`;const alert:Alert={id,title:'Manual training alert',hazard:'flash_flood',siteId:focusSite==='all'?'SITE-001':focusSite,severity:'WATCH',time:new Date().toISOString(),state:'active',delivery:'simulated',description:'Operator-generated notification simulation. No real alerts were sent.'};setAddedAlerts(prev=>[alert,...prev]);setAddedEvents(prev=>[{id:`EV-T-${Date.now()}`,title:'Test alert generated',detail:'Demo-only training event.',time:alert.time,kind:'operator',severity:'WATCH',siteId:alert.siteId},...prev])}
 const value:Store={mode,setMode,scenario,chooseScenario,apiBase,setApiBase,refreshSeconds,setRefreshSeconds,density,setDensity,focusSite,setFocusSite,snapshot,risk:overallRisk(snapshot.hazards),refresh,refreshing,error,acknowledge:id=>recordAlert(id,'acknowledged'),resolve:id=>recordAlert(id,'resolved'),testAlert}
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
export function usePrism(){const ctx=useContext(StoreContext);if(!ctx)throw Error('usePrism must be used within provider');return ctx}
