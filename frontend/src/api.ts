import type {
  ChatResponse,
  DashboardData,
  DateRangeKey,
  ExecutiveBrief,
  IngestionRun,
  ReportResult,
  CuratedNewsResponse,
  NewsPipelineStatus,
  NewsSourceItem
} from './types';
export const API = import.meta.env.VITE_API_URL || '/api';
async function request<T>(path:string,init?:RequestInit):Promise<T>{const r=await fetch(`${API}${path}`,init);if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json()}
function rangeParams(key:DateRangeKey){const p=new URLSearchParams();if(key!=='all'){const days=key==='30d'?30:key==='90d'?90:key==='6m'?183:365;const end=new Date();const start=new Date(end);start.setDate(start.getDate()-days);p.set('start',start.toISOString().slice(0,10));p.set('end',end.toISOString().slice(0,10))}return p}
export async function getDashboard(range:DateRangeKey):Promise<DashboardData>{const p=rangeParams(range);const add=(limit?:number)=>{const x=new URLSearchParams(p);if(limit)x.set('limit',String(limit));return x.size?`?${x}`:''};const [overview,prices,trade,sales,competitors,stocks,intelligence,brief]=await Promise.all([request(`/dashboard/bromine-overview${add()}`),request(`/prices${add(5000)}`),request(`/trade-records${add(10000)}`),request(`/sales-records${add(10000)}`),request('/competitors'),request(`/competitors/stocks${add()}`),request('/intelligence-items?limit=100'),request<ExecutiveBrief>('/executive-briefs/latest?product=bromine').catch(()=>null)]);return {overview,prices,trade,sales,competitors,stocks,intelligence,brief:brief||null} as DashboardData}
export const getLatestBrief=()=>request<ExecutiveBrief>('/executive-briefs/latest?product=bromine');
export const askQuestion=(question:string)=>request<ChatResponse>('/chat/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});
export const generateReport=(report_type:string)=>request<ReportResult>('/reports/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({report_type})});
export const getIngestionStatus=()=>request<IngestionRun[]>('/ingestion/status?limit=25');
export const submitIntelligence=(payload:Record<string,string>)=>request<{id:number;status:string}>('/intelligence/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});

export const getCuratedNews = (params?: { category?: string; geography?: string; impact_level?: string; limit?: number; offset?: number }) => {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.geography) q.set('geography', params.geography);
  if (params?.impact_level) q.set('impact_level', params.impact_level);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return request<CuratedNewsResponse>(`/news/curated-feed${qs}`);
};

export const getNewsStatus = () => request<NewsPipelineStatus>('/news/status');
export const getNewsSources = () => request<NewsSourceItem[]>('/news/sources');
export const triggerNewsIngestion = () => request<{ status: string; message: string; stats: any }>('/news/ingest/trigger', { method: 'POST' });
export const getDataSourcesSummary = () => request<import('./types').DataSourcesSummary>('/data-sources/summary');

