import { HAZARD_IDS, HAZARD_NAMES, SENSOR_IDS, type Alert, type EventItem, type Hazard, type Sensor, type Snapshot, type Station, severity } from './model'
const obj=(x:unknown):Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x)?x as Record<string,unknown>:{}
const array=(x:unknown):unknown[]=>Array.isArray(x)?x:Array.isArray(obj(x).items)?obj(x).items as unknown[]:Array.isArray(obj(x).data)?obj(x).data as unknown[]:Array.isArray(obj(x).results)?obj(x).results as unknown[]:[]
const str=(x:unknown,def='')=>typeof x==='string'?x:def
const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)?x:null
async function get(base:string,path:string,optional=false){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(`${base.replace(/\/$/,'')}${path}`,{signal:controller.signal});if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);return await response.json() as unknown}catch(err){if(optional)return null;throw err}finally{clearTimeout(timeout)}}
export async function testBackend(base:string){const answer=await get(base,'/health');return JSON.stringify(answer).slice(0,180)}
export async function loadLive(base:string):Promise<Snapshot>{
 const [siteRaw,readingRaw,riskRaw,alertRaw,eventRaw,historyRaw]=await Promise.all([
  get(base,'/api/v1/sites'),get(base,'/api/v1/readings/latest'),get(base,'/api/v1/risk/current'),
  get(base,'/api/v1/alerts'),get(base,'/api/v1/events'),get(base,'/api/v1/readings/history',true)
 ])
 const sites=array(siteRaw);const readings=array(readingRaw);const risks=array(riskRaw)
 if(!sites.length)throw new Error('No usable sites returned from /api/v1/sites. Check your backend API contract.')
 if(!risks.length)throw new Error('No risk results returned. Check /api/v1/risk/current payload shape.')
 const stations:Station[]=sites.map((item,i):Station=>{const p=obj(item);return {id:str(p.id,`SITE-${i+1}`),name:str(p.name,'Unnamed station'),location:str(p.location,'Location unavailable'),deployment:str(p.deployment,'Unspecified'),lat:num(p.latitude)??Number.NaN,lng:num(p.longitude)??Number.NaN,status:p.device_status==='offline'?'offline':p.device_status==='stale'?'stale':'online',risk: num(p.risk_score),freshness:str(p.last_updated,'Unknown'),x:22+(i%4)*17,y:27+(i%3)*22}})
 const hazards:Hazard[]=HAZARD_IDS.map((id):Hazard=>{const match=obj(risks.find(r=>obj(r).id===id));const score=num(match.score);return{id,name:HAZARD_NAMES[id],score,trend:match.trend==='increasing'||match.trend==='decreasing'||match.trend==='stable'?match.trend:'unknown',factors:Array.isArray(match.factors)?match.factors.map(f=>str(f)).filter(Boolean):[],actions:[]}})
 const sensors:Sensor[]=readings.filter(r=>SENSOR_IDS.includes(str(obj(r).sensor_type) as Sensor['id'])).map((r):Sensor=>{const p=obj(r);return {id:str(p.sensor_type) as Sensor['id'],name:str(p.sensor_type).replaceAll('_',' '),value:num(p.value),previous:num(p.previous_value),unit:str(p.unit),siteId:str(p.site_id),status:p.status==='offline'?'offline':p.status==='stale'?'stale':'online',time:str(p.timestamp)}})
 const alerts:Alert[]=array(alertRaw).map((r,i):Alert=>{const p=obj(r);const hazard=HAZARD_IDS.includes(str(p.hazard) as Hazard['id'])?str(p.hazard) as Hazard['id']:'flash_flood';return{id:str(p.id,`LIVE-${i}`),hazard,title:str(p.title,'Unlabeled alert'),siteId:str(p.site_id),severity:['NORMAL','WATCH','WARNING','CRITICAL'].includes(str(p.severity))?str(p.severity) as Alert['severity']:severity(num(p.score)),time:str(p.timestamp),description:str(p.description),state:p.status==='resolved'?'resolved':p.status==='acknowledged'?'acknowledged':'active',delivery:'unavailable'}})
 const events:EventItem[]=array(eventRaw).map((r,i):EventItem=>{const p=obj(r);return{id:str(p.id,`LIVE-E-${i}`),time:str(p.timestamp),title:str(p.title,'Unlabeled event'),detail:str(p.detail),kind:['sensor','alert','operator','system'].includes(str(p.kind))?str(p.kind) as EventItem['kind']:'system',severity:['NORMAL','WATCH','WARNING','CRITICAL'].includes(str(p.severity))?str(p.severity) as EventItem['severity']:'UNKNOWN',siteId:str(p.site_id)}})
 const series=array(historyRaw).map(x=>num(obj(x).value)).filter((x):x is number=>x!==null)
 return {hazards,stations,sensors,alerts,events,series,updatedAt:new Date().toISOString(),isSimulated:false}
}
