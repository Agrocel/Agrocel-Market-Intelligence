export interface Overview { latest_price:{value:number;date:string|null;currency:string;unit:string;change_percent:number}; exports:{quantity_mt:number;value_usd:number;shipments_count?:number;average_price_usd_per_mt?:number}; imports:{quantity_mt:number;value_usd:number;shipments_count?:number;average_price_usd_per_mt?:number}; sales:{quantity_mt:number;realization_inr_per_mt:number;revenue_inr?:number}; high_impact_items:number;competitor_updates:number }
export interface PriceRecord { id:number;date:string;value:number;currency:string;unit:string;source:string;grade:string }
export interface TradeRecord { id:number;date:string;direction:'IMPORT'|'EXPORT';quantity_mt:number;value_usd:number;average_price:number;partner:string;reporting:string;hs_code:string;source:string;financial_year?:string;indian_port?:string|null;foreign_port?:string|null;indian_company?:string|null;foreign_company?:string|null;bill_no?:string|null;product_name?:string|null;trade_value_inr?:number|null;unit_rate_inr?:number|null }
export interface SalesRecord { id:number;date:string;quantity_mt:number;revenue_inr:number;realization:number;customer:string;segment:string;confidential:boolean;invoice_no?:string|null;financial_year?:string;product?:string;category?:string;consignee?:string|null;state_or_zone?:string|null;location?:string|null;po_number?:string|null;quantity_kg?:number;basic_rate_per_kg?:number|null;net_realization_per_kg?:number|null;realization_inr_per_mt?:number;gross_amount_inr?:number|null;source_file?:string }
export interface Competitor { id:number;name:string;country:string;listed:boolean;ticker:string|null;website:string|null }
export interface StockRecord { id:number;ticker:string;date:string;close_price:number;currency:string;volume:number;source:string }
export interface IntelligenceItem { id:number;title:string;summary:string;date:string;type:string;impact:string;reliability:string;source_url:string|null;status:string }
export interface IngestionRun { id:number;pipeline:string;file:string;status:string;processed:number;loaded:number;rejected:number;duplicate:number;started_at:string;completed_at:string|null;warnings:string|null }
export interface Citation { title:string;source_type:string;page_number?:number;reliability_grade?:string;confidence?:number;snippet?:string;url?:string;document_title?:string;reliability?:string }
export interface ChatResponse { question:string;answer:string;confidence:number;sources:Citation[] }
export interface ReportResult { title:string;generated_at:string;report_type:string;markdown:string;key_metrics:Record<string,unknown>;citations:Citation[] }
export interface WhoDidWhatItem { entity:string;role:string;action:string;impact:string;reliability_grade:string;source:string }
export interface MarketNarrativeData { headline:string;full_text:string;who_did_what:WhoDidWhatItem[] }
export interface ExecutiveBriefCitation { id:number;citation_text:string;source_title:string;source_url_or_file?:string;page_number?:number;published_at?:string;reliability_grade:string }
export interface ExecutiveBriefSection { key:string;title:string;content_markdown:string;structured_json?:any }
export interface DataGroundingItem {
  token_pattern: string;
  metric: string;
  source_name: string;
  source_type?: string;
  category_badge?: 'EXPORT_DATA' | 'IMPORT_DATA' | 'MARKET_PRICE' | 'INTERNAL_SALES' | 'NEWS_INTELLIGENCE' | 'FORECAST_MODEL';
  date_range: string;
  period_start?: string;
  period_end?: string;
  value_raw?: number | string;
  unit?: string;
  reliability_grade: string;
  audit_notes?: string;
  table_reference?: string;
  methodology?: string;
}
export interface ExecutiveBrief { id:number;brief_type:string;product:string;period_start:string;period_end:string;generated_at:string;generated_by:string;overall_market_direction:string;status:string;market_narrative?:MarketNarrativeData|null;executive_summary:string;why_it_matters?:string;management_attention?:string;source_count:number;sections?:ExecutiveBriefSection[];citations?:ExecutiveBriefCitation[];data_grounding?:DataGroundingItem[] }
export interface DashboardData { overview:Overview;prices:PriceRecord[];trade:TradeRecord[];sales:SalesRecord[];competitors:Competitor[];stocks:StockRecord[];intelligence:IntelligenceItem[];brief?:ExecutiveBrief|null }
export type DateRangeKey='30d'|'90d'|'6m'|'1y'|'all';

export interface NewsIntelligencePayload {
  id?: number;
  category: string;
  geography: string;
  impact_level: string;
  reliability_grade: string;
  strategic_implication: string;
  why_it_matters: string;
}

export interface CuratedNewsItem {
  id: number;
  title: string;
  summary: string;
  canonical_url: string;
  publisher: string;
  publisher_region: string;
  published_at: string | null;
  relevance_score: number;
  corroboration_count: number;
  is_multi_source_corroborated: boolean;
  intelligence?: NewsIntelligencePayload | null;
}

export interface CuratedNewsResponse {
  total: number;
  limit: number;
  offset: number;
  items: CuratedNewsItem[];
}

export interface NewsPipelineStatus {
  scheduler: {
    is_running: boolean;
    interval_minutes: number;
    last_run_at?: string | null;
    total_scheduled_runs: number;
  };
  database_counts: {
    total_articles: number;
    relevant_articles: number;
    rejected_articles: number;
    duplicate_articles: number;
    total_intelligence_items: number;
  };
  recent_runs: Array<{
    id: number;
    pipeline_name: string;
    status: string;
    started_at: string;
    completed_at?: string | null;
    articles_fetched: number;
    articles_new: number;
    articles_relevant: number;
    articles_rejected: number;
  }>;
}

export interface NewsSourceItem {
  id: number;
  source_name: string;
  source_type: string;
  base_url: string;
  feed_url?: string | null;
  publisher_region: string;
  default_reliability_grade: string;
  allowed_for_automated_fetch: boolean;
  active: boolean;
  fetch_frequency_minutes: number;
  last_fetched_at?: string | null;
  notes?: string | null;
}

export interface DataFeedMetadata {
  id: string;
  name: string;
  classification: string;
  authority: string;
  source_file: string;
  hs_code?: string;
  start_date: string;
  end_date: string;
  total_records: number;
  total_quantity_mt?: number;
  total_value_usd?: number;
  total_revenue_inr?: number;
  latest_value?: string;
  update_frequency: string;
  lag_notes: string;
  reliability_grade: string;
  status: string;
}

export interface DataSourcesSummary {
  common_horizon: {
    month_label: string;
    month_start: string;
    month_end: string;
    common_date: string;
    explanation: string;
    overlap_coverage_pct: number;
  };
  feeds: DataFeedMetadata[];
  news_sources: NewsSourceItem[];
  documents: Array<{
    id: number;
    title: string;
    type: string;
    source_name: string;
    file_path?: string;
    ingested_at?: string;
    status: string;
  }>;
}

