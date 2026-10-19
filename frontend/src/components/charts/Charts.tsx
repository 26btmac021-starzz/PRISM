import { CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis, YAxis, Line, LineChart, Bar, BarChart, Cell, Pie, PieChart } from 'recharts';
import type { Point } from '../../types';
import { fmtTime } from '../../utils';

const grid = '#21334a';
const tip = { backgroundColor: '#122034', border: '1px solid #2c455c', borderRadius: 10, fontSize: 11, color: '#d8e9f6' };
export function Sparkline({ data, color = '#39c9ed' }: { data: Point[]; color?: string }) {
  if (!data.length) return <div className="h-full border-b border-dashed border-slate-600"/>;
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data}><Line type="monotone" dot={false} isAnimationActive={false} strokeWidth={2} stroke={color} dataKey="value"/></LineChart></ResponsiveContainer>;
}
export function TrendChart({ data, color = '#39c9ed', height = 235, suffix = '', area = true }: { data: Point[]; color?: string; height?: number; suffix?: string; area?: boolean }) {
  if (!data.length) return <div className="empty-chart">No historical samples returned for this range</div>;
  const d = data.map(p => ({ ...p, label: fmtTime(p.timestamp) }));
  return <div style={{ height }} className="w-full"><ResponsiveContainer width="100%" height="100%">{area ? <AreaChart data={d} margin={{ top: 15, right: 10, bottom: 2, left: -20 }}>
    <defs><linearGradient id="prism-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.24}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
    <CartesianGrid stroke={grid} vertical={false} strokeDasharray="4 5"/><XAxis dataKey="label" tick={{ fill: '#7890a8', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={32}/><YAxis tick={{ fill: '#7890a8', fontSize: 10 }} tickLine={false} axisLine={false}/><Tooltip contentStyle={tip} formatter={v => [`${v ?? '—'}${suffix}`, 'Reading']} labelStyle={{ color: '#b6d0e5' }}/><Area type="monotone" dataKey="value" stroke={color} fill="url(#prism-area)" strokeWidth={2.2} dot={false} isAnimationActive={false}/>
  </AreaChart> : <LineChart data={d} margin={{ top: 15, right: 10, bottom: 2, left: -20 }}><CartesianGrid stroke={grid} vertical={false} strokeDasharray="4 5"/><XAxis dataKey="label" tick={{ fill: '#7890a8', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={32}/><YAxis tick={{ fill: '#7890a8', fontSize: 10 }} tickLine={false} axisLine={false}/><Tooltip contentStyle={tip}/><Line dataKey="value" stroke={color} strokeWidth={2.2} dot={false} isAnimationActive={false}/></LineChart>}</ResponsiveContainer></div>;
}
export function HorizontalBar({ data, color = '#39c9ed', height = 240 }: { data: { name: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return <div className="empty-chart">No data in selected period</div>;
  return <div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={data} margin={{ left: 22, right: 18, top: 6, bottom: 6 }}><CartesianGrid stroke={grid} horizontal={false} strokeDasharray="4 5"/><XAxis type="number" domain={[0,100]} tick={{ fill: '#7890a8', fontSize: 10 }} tickLine={false} axisLine={false}/><YAxis dataKey="name" type="category" width={95} tick={{ fill: '#9ab0c5', fontSize: 11 }} tickLine={false} axisLine={false}/><Tooltip contentStyle={tip}/><Bar dataKey="value" fill={color} radius={[0,5,5,0]} barSize={14}/></BarChart></ResponsiveContainer></div>;
}
export function BarOverview({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) { return <div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke={grid} vertical={false}/><XAxis dataKey="name" tick={{ fill: '#8ba3b8', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#8ba3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}/><Tooltip contentStyle={tip}/><Bar dataKey="value" fill="#39c9ed" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>; }
export function Donut({ data, height = 220 }: { data: { name: string; value: number; fill: string }[]; height?: number }) { return <div style={{ height }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={53} outerRadius={76} paddingAngle={4} stroke="none">{data.map((v, i) => <Cell key={i} fill={v.fill}/>)}</Pie><Tooltip contentStyle={tip}/></PieChart></ResponsiveContainer></div>; }
