import { type Alert, type EventItem, type Hazard, type HazardId, type Scenario, type Sensor, type Snapshot, type Station, HAZARD_IDS, HAZARD_NAMES, SENSOR_IDS, severity } from './model'
export const SCENARIOS:Scenario[] = [
 {id:'normal',label:'01 — Normal conditions',subtitle:'Systems nominal / all clear',hazardScores:[18,13,22,8,17],readings:[3.2,0.8,28,0.4,0.7,22.4,58]},
 {id:'rainfall',label:'02 — Rising rainfall',subtitle:'Upstream flow accelerating',hazardScores:[72,31,49,8,62],readings:[42.8,3.9,62,1.2,0.8,20.1,89]},
 {id:'slope',label:'03 — Slope instability',subtitle:'Tilt and saturation increase',hazardScores:[38,84,24,11,42],readings:[20.2,1.5,89,8.4,1.9,21.2,83]},
 {id:'drainage',label:'04 — Urban flooding',subtitle:'Drainage network surcharged',hazardScores:[44,20,88,9,91],readings:[58.3,5.4,79,0.8,0.6,23.1,95]},
 {id:'vibration',label:'05 — Ground anomaly',subtitle:'Vibration event requires inspection',hazardScores:[17,33,19,78,18],readings:[5.2,0.9,31,2.9,12.8,22.9,54]},
 {id:'disconnected',label:'06 — Sensor disconnect',subtitle:'Some readings unavailable',hazardScores:[30,28,33,12,27],readings:[9.2,1.4,40,0.9,0.5,21.3,67],stale:true},
 {id:'escalation',label:'07 — Escalating risk',subtitle:'Multi-hazard conditions worsening',hazardScores:[93,76,81,17,90],readings:[78.1,6.1,91,5.1,2.3,19.8,97]},
 {id:'workflow',label:'08 — Alert workflow',subtitle:'Train triage and resolution',hazardScores:[65,62,44,16,57],readings:[31.2,3.0,74,3.9,1.1,20.3,81]}
]
export const SITE_BASE:Station[] = [
 {id:'SITE-001',name:'Trikuta Ridge',location:'Katra highland',deployment:'Slope',lat:33.014,lng:74.962,status:'online',risk:48,freshness:'8 sec ago',x:68,y:26},
 {id:'SITE-002',name:'Chenab Corridor',location:'River monitoring zone',deployment:'Riverside',lat:33.072,lng:74.834,status:'online',risk:59,freshness:'14 sec ago',x:28,y:38},
 {id:'SITE-003',name:'SMVDU Base',location:'University campus',deployment:'Campus',lat:32.988,lng:74.954,status:'online',risk:21,freshness:'4 sec ago',x:59,y:58},
 {id:'SITE-004',name:'Katra Drain',location:'Municipal outflow',deployment:'Urban',lat:32.992,lng:74.928,status:'online',risk:34,freshness:'12 sec ago',x:43,y:68},
 {id:'SITE-005',name:'Jammu Foothills',location:'Southern station',deployment:'Slope',lat:32.865,lng:74.858,status:'online',risk:28,freshness:'20 sec ago',x:22,y:83}
]
export const SENSOR_META:Record<typeof SENSOR_IDS[number],{name:string;unit:string;siteId:string}>={
 rainfall:{name:'Rainfall',unit:'mm/h',siteId:'SITE-002'},water_level:{name:'Water level',unit:'m',siteId:'SITE-002'},soil_moisture:{name:'Soil moisture',unit:'%',siteId:'SITE-001'},tilt:{name:'Ground tilt',unit:'°',siteId:'SITE-001'},vibration:{name:'Vibration',unit:'mm/s',siteId:'SITE-001'},temperature:{name:'Temperature',unit:'°C',siteId:'SITE-003'},humidity:{name:'Humidity',unit:'%',siteId:'SITE-003'}
}
const EXPLANATIONS:Record<HazardId,{factors:string[];actions:string[]}>={
 flash_flood:{factors:['Sustained upstream rainfall','Water-level change and flow conditions','Riverbank station observations'],actions:['Verify upstream station telemetry','Check official weather and river bulletins','Prepare field teams; do not issue public warnings from demo readings']},
 landslide:{factors:['Moisture accumulation in hillside soils','Slope tilt changes','Rainfall and local terrain exposure'],actions:['Inspect soil and tilt sensors','Escalate onsite visual inspection','Restrict risky field access until verified']},
 urban_flood:{factors:['Intense localized rainfall','Drainage surcharge','Low-lying surface accumulation'],actions:['Verify urban drainage sensor status','Inspect low-lying access routes','Share observations with authorized operations team']},
 ground_motion:{factors:['Anomalous vibration pattern','Equipment and site movement possible','No predictive earthquake inference'],actions:['Check for sensor faults or nearby equipment','Request qualified field verification','Do not interpret this as an earthquake prediction']},
 waterlogging:{factors:['Surface moisture and runoff','Low drainage capacity','Persistent rainfall over catchment'],actions:['Inspect standing-water hotspots','Assess drainage outlet obstructions','Verify readings with onsite observations']}
}
export function buildDemo(id:string):Snapshot {
 const scenario=SCENARIOS.find(x=>x.id===id)||SCENARIOS[0]; const now=new Date().toISOString();
 const hazards:Hazard[]=HAZARD_IDS.map((hid,i):Hazard=>({id:hid,name:HAZARD_NAMES[hid],score:scenario.hazardScores[i],trend:scenario.id==='normal'?'stable':scenario.id==='disconnected'?'unknown':'increasing',...EXPLANATIONS[hid]}))
 const stations=SITE_BASE.map((site,i)=>({...site,status:scenario.stale && (i===1||i===3)?'offline' as const:'online' as const,risk:scenario.stale && i===1?null:Math.max(4,Math.min(100,Math.round(scenario.hazardScores[(i+2)%5]*(0.65+i*.095))))}));
 const sensors:Sensor[]=SENSOR_IDS.map((sensor,i):Sensor=>({id:sensor,name:SENSOR_META[sensor].name,value:scenario.stale&&(i===0||i===3)?null:scenario.readings[i],unit:SENSOR_META[sensor].unit,previous:scenario.readings[i]*0.91,status:scenario.stale&&(i===0||i===3)?'offline':'online',time:now,siteId:SENSOR_META[sensor].siteId}))
 const top=[...hazards].sort((a,b)=>(b.score??-1)-(a.score??-1));const alertCandidates=top.filter(x=>(x.score??0)>30).slice(0,scenario.id==='workflow'?4:3)
 const alerts:Alert[]=alertCandidates.map((h,i):Alert=>({id:`DEMO-A-${String(i+1).padStart(3,'0')}`,hazard:h.id,title:`${h.name} ${severity(h.score).toLowerCase()} threshold`,siteId:stations[(i+1)%stations.length].id,severity:severity(h.score),time:new Date(Date.now()-(i+1)*12*60000).toISOString(),state:'active',delivery:'simulated',description:`Deterministic training event based on the ${scenario.label.toLowerCase()} scenario. Not a verified physical observation.`}))
 const events:EventItem[]=[{id:'EV-100',time:now,title:'Scenario feed initialized',detail:`Training mode: ${scenario.label}`,kind:'system',severity:'NORMAL',siteId:'SITE-003'},...alerts.map((a,i)=>({id:`EV-${101+i}`,time:a.time,title:a.title,detail:a.description,kind:'alert' as const,severity:a.severity,siteId:a.siteId})),{id:'EV-110',time:new Date(Date.now()-49*60000).toISOString(),title:'Routine sensor heartbeat',detail:'All available station telemetry polled.',kind:'sensor',severity:'NORMAL',siteId:'SITE-001'}]
 const score=top[0]?.score??0;
 const series=Array.from({length:32},(_,i)=>Math.max(3,Math.min(100,Math.round(score*(.35+.65*i/31)+8*Math.sin(i*.87)+5*Math.sin(i*.29)))))
 return {hazards,sensors,stations,alerts,events,updatedAt:now,series,isSimulated:true}
}
