export interface Overview { latest_price:{value:number;date:string|null;currency:string;unit:string;change_percent:number}; exports:{quantity_mt:number;value_usd:number;shipments_count?:number;average_price_usd_per_mt?:number}; imports:{quantity_mt:number;value_usd:number;shipments_count?:number;average_price_usd_per_mt?:number}; sales:{quantity_mt:number;realization_inr_per_mt:number;revenue_inr?:number}; high_impact_items:number;competitor_updates:number; executive_overview?: ExecutiveOverviewComplete; }
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
export interface WhoDidWhatItem { entity:string;role:string;action:string;impact:string;reliability_grade:string;source:string;quote?:string|null;speaker?:string|null;category?:string|null;sentiment?:string|null }
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

export interface CompetitorReportItem {
  id: number;
  title: string;
  report_type: string;
  fiscal_period: string;
  filing_date: string;
  filing_authority: string;
  source_url?: string | null;
  highlights: string;
  key_topics: string;
  document_summary?: string | null;
}

export interface CompetitorMetricItem {
  id: number;
  period: string;
  date: string;
  is_annual: boolean;
  segment_name: string;
  currency: string;
  revenue_usd_m: number | null;
  volume_mt: number | null;
  ebitda_usd_m: number | null;
  ebitda_margin_pct: number | null;
  realized_price_per_mt: number | null;
  capacity_utilization_pct: number | null;
}

export interface CompetitorStrategicFindingItem {
  id: number;
  period: string;
  category: string;
  headline: string;
  summary: string;
  transcript_quote?: string | null;
  speaker?: string | null;
  sentiment: string;
  agrocel_takeaway: string;
}

export interface CompetitorDossierSummary {
  id: number;
  name: string;
  country: string;
  ticker?: string | null;
  website?: string | null;
  reports_count: number;
  latest_filing?: {
    title: string;
    date: string;
    type: string;
    period: string;
    authority: string;
  } | null;
  scorecard: {
    latest_revenue_usd_m?: number | null;
    latest_volume_mt?: number | null;
    latest_ebitda_usd_m?: number | null;
    latest_margin_pct?: number | null;
    latest_price_per_mt?: number | null;
    latest_utilization_pct?: number | null;
    period?: string | null;
  };
  strategic_pulse?: string | null;
  findings_count: number;
}

export interface CompetitorDossierDetail {
  competitor: {
    id: number;
    name: string;
    country: string;
    ticker?: string | null;
    website?: string | null;
  };
  reports: CompetitorReportItem[];
  metrics: CompetitorMetricItem[];
  findings: CompetitorStrategicFindingItem[];
}

export interface CompetitorPulseItem {
  id: number;
  competitor_id: number | null;
  competitor_name: string;
  ticker?: string | null;
  period: string;
  category: string;
  headline: string;
  summary: string;
  transcript_quote?: string | null;
  speaker?: string | null;
  sentiment: string;
  agrocel_takeaway: string;
}

// ==========================================
// 9-Section Executive Overview Types
// ==========================================

export interface ExecutiveMarketSnapshot {
  market_situation: string;
  price_direction: {
    status: string;
    trend: string;
    benchmark_cif_usd_mt: number;
    benchmark_label: string;
    historical_trough_usd_mt: number;
    recovery_pct: number;
    change_description: string;
  };
  agrocel_position: {
    domestic_sales_volume_mt: number;
    financial_year: string;
    volume_growth_yoy_pct: number;
    weighted_avg_realization_inr_mt: number;
    weighted_avg_realization_usd_mt: number;
    price_growth_yoy_pct: number;
    scale_vs_india_exports_ratio_pct: number;
    position_summary: string;
  };
  supply_demand_summary: {
    supply_status: string;
    demand_status: string;
    key_drivers: string[];
  };
  risks_and_opportunities: {
    key_risks: string[];
    key_opportunities: string[];
  };
}

export interface PriceBenchmarkPoint {
  period: string;
  agrocel_volume_mt: number;
  agrocel_realization_inr_mt: number | null;
  agrocel_realization_usd_mt: number | null;
  cif_india_import_parity_usd_mt: number | null;
  fob_india_export_price_usd_mt: number | null;
  china_spot_benchmark_usd_mt: number | null;
}

export interface Section1PriceBenchmarks {
  benchmark_methodology: {
    selected_international_benchmark: string;
    rationale: string;
    china_spot_role: string;
    export_fob_role: string;
    conversion_standard: string;
    agrocel_formula: string;
  };
  latest_metrics: {
    period: string;
    agrocel_weighted_realization_inr_mt: number;
    agrocel_weighted_realization_usd_mt: number;
    cif_india_import_parity_usd_mt: number;
    fob_india_export_price_usd_mt: number;
    china_spot_benchmark_usd_mt: number;
    agrocel_spread_vs_cif_usd_mt: number;
  };
  domestic_pricing_headroom?: {
    agrocel_price_inr_kg: number;
    import_parity_inr_kg: number;
    headroom_inr_kg: number;
    headroom_usd_mt: number;
    headroom_pct: number;
    is_safe_buffer: boolean;
    status_label: string;
    inr_usd_exchange_rate?: number;
    exchange_rate_source?: string;
  };
  recent_import_deals?: Array<{
    date: string;
    origin_country: string;
    port: string;
    importer: string;
    quantity_mt: number;
    price_usd_mt: number;
    price_inr_kg: number | null;
  }>;
  ai_price_interpretation: string;
  timeline: PriceBenchmarkPoint[];
}

export interface ProducingCountry {
  country: string;
  share_pct: number;
  annual_capacity_mt?: number;
  nameplate_capacity_mt?: number;
  estimated_utilization_pct?: number;
  actual_production_estimate_mt?: number;
  primary_producer?: string;
  primary_producers?: string[];
  brine_source: string;
  operating_status: string;
  operating_status_code?: 'STABLE' | 'CONSTRAINED' | 'EXPANDING' | 'MONITORING';
  status_evidence?: string;
  most_important_recent_development?: string;
  potential_supply_impact?: string;
  regulatory_operational_notes?: string;
  supporting_news?: string;
  source_references?: string;
  last_verified_date?: string;
  developments?: string;
}

export interface SupplyNewsLayer {
  source_supported_facts: string;
  market_interpretation: string;
  agrocel_business_implication: string;
}

export interface SupplyNewsDevelopment {
  id: number;
  headline: string;
  original_source_url: string;
  source_publisher: string;
  publication_date: string;
  event_date: string;
  country_region: string;
  producer_involved: string;
  event_category: string;
  event_category_code: string;
  capacity_affected: string;
  expected_duration: string;
  market_direction: string;
  confidence_status: string;
  reliability_grade: string;
  impact_level: string;
  layers: SupplyNewsLayer;
}

export interface RegionalSupplyCondition {
  region_id: string;
  region_name: string;
  status: string;
  status_code: 'CONSTRAINED' | 'BOTTLENECKED' | 'EXPANDING' | 'STABLE';
  direction_of_change: string;
  direction_icon?: string;
  latest_material_development: string;
  market_implication: string;
  supporting_source: string;
  last_updated: string;
}

export interface SupplyHistoricalChange {
  change_id: string;
  category: string;
  title: string;
  prior_state: string;
  current_state: string;
  market_significance: string;
  evidence_source: string;
  date_observed: string;
}

export interface ExecutiveSupplySummary {
  market_balance_status: string;
  market_balance_code: string;
  supply_direction: string;
  countries_requiring_attention: Array<{ country: string; reason: string }>;
  key_developments_headline: string;
  ai_executive_summary_text: string;
  reporting_period: string;
  latest_refresh_date: string;
  kpi_metrics: {
    total_nameplate_capacity_mt: number;
    total_estimated_production_mt: number;
    effective_global_utilization_pct: number;
    china_structural_deficit_mt: number;
    middle_east_freight_surcharge_usd_mt: number;
    india_domestic_price_headroom_inr_kg: number;
  };
}

export interface GlobalCapacityDistribution {
  total_nameplate_capacity_mt: number;
  total_estimated_production_mt: number;
  effective_global_utilization_pct: number;
  reporting_period: string;
  source_citation: string;
  countries: Array<{
    country: string;
    nameplate_capacity_mt: number;
    share_pct: number;
    estimated_utilization_pct: number;
    actual_production_estimate_mt: number;
    operating_status: string;
    operating_status_code: string;
  }>;
  concentration_insight: {
    top_2_share_pct: number;
    dead_sea_merchant_share_pct: number;
    china_actual_production_share_pct: number;
    india_production_share_pct: number;
  };
  ai_distribution_insight: string;
}

export interface AgrocelSupplyImplications {
  headline: string;
  import_dependence: string;
  import_competitiveness: string;
  domestic_supply_conditions: string;
  supply_risks: string[];
  emerging_opportunities: string[];
  strategic_guidance: string;
  ai_management_summary: string;
}

export interface MarketBalanceFactor {
  factor_name: string;
  weight: number;
  direction: string;
  score: number;
  evidence: string;
}

export interface MarketBalanceAssessment {
  status: string;
  code: string;
  score: number;
  max_score: number;
  confidence_level: string;
  rationale: string;
  factors: MarketBalanceFactor[];
  refresh_date: string;
}

export interface Section2Supply {
  // Backward compatibility fields
  global_supply_status: string;
  total_global_capacity_mt: number;
  producing_countries: ProducingCountry[];
  regional_developments: Array<{
    region: string;
    status: string;
    evidence: string;
  }>;
  ai_supply_assessment: string;

  // Rich executive supply intelligence fields
  executive_supply_summary?: ExecutiveSupplySummary;
  latest_key_supply_developments?: {
    total_developments_found: number;
    key_developments: SupplyNewsDevelopment[];
    all_developments: SupplyNewsDevelopment[];
    ai_developments_summary: string;
  };
  global_capacity_distribution?: GlobalCapacityDistribution;
  country_intelligence_cards?: {
    countries: ProducingCountry[];
    ai_country_insights: string;
  };
  regional_supply_conditions?: {
    regions: RegionalSupplyCondition[];
    ai_regional_summary: string;
  };
  what_changed_since_last_update?: {
    baseline_period: string;
    current_period: string;
    has_historical_snapshot: boolean;
    changes: SupplyHistoricalChange[];
    summary_text: string;
  };
  agrocel_business_implications?: AgrocelSupplyImplications;
  market_balance_assessment?: MarketBalanceAssessment;
}


export interface DownstreamSector {
  sector: string;
  share_pct: number;
  key_products: string;
  end_markets: string;
  trend: string;
  commentary: string;
}

export interface Section3Demand {
  downstream_sectors: DownstreamSector[];
  regional_demand: Array<{
    region: string;
    share_pct: number;
    annual_consumption_mt: number;
    status: string;
  }>;
  ai_demand_interpretation: string;
}

export interface TradeComparisonRow {
  period: string;
  agrocel_domestic_sales_mt: number;
  india_total_bromine_exports_mt: number;
  agrocel_domestic_sales_growth_pct: number | null;
  india_export_growth_pct: number | null;
  agrocel_vs_india_export_volume_ratio_pct: number | null;
  agrocel_export_sales_mt: number;
}

export interface OECTradeIntelligence {
  hs_code: string;
  hs_description: string;
  global_trade_value_usd_b: number;
  global_trade_volume_mt: number;
  source: string;
  licensing_status: string;
  top_global_exporters: Array<{ country: string; share_pct: number; trade_value_usd_m: number; rank: number }>;
  top_global_importers: Array<{ country: string; share_pct: number; trade_value_usd_m: number; rank: number }>;
  india_position_summary: string;
}

export interface Section4Trade {
  comparison_table: TradeComparisonRow[];
  monthly_comparison?: TradeComparisonRow[];
  disclosure_note: string;
  india_trade_flows: {
    top_export_destinations: Array<{ country: string; volume_mt: number }>;
    top_import_origins: Array<{ country: string; volume_mt: number }>;
    china_export_trend: string;
  };
  oec_trade_intelligence: OECTradeIntelligence;
}

export interface Section5Production {
  agrocel_production: {
    facility_location: string;
    nameplate_capacity_mt_year: number;
    active_production_run_rate_mt: number;
    capacity_utilization_pct: number;
    extraction_process: string;
    seasonal_cycle: {
      peak_season: string;
      lean_season: string;
      peak_bittern_density_be: string;
      operational_note: string;
    };
  };
  global_production_footprint: Array<{
    producer: string;
    location: string;
    capacity_mt: number;
    source: string;
    utilization_pct: number;
  }>;
  monsoon_inventory_tracker?: {
    monsoon_window: string;
    required_monsoon_reserve_mt: number;
    current_finished_stockpile_mt: number;
    stockpile_target_pct: number;
    customer_days_coverage: number;
    days_until_shutdown: number;
    weekly_build_rate_mt: number;
    status: string;
    operational_readiness: string;
  };
  ai_production_summary: string;
}

export interface PlantOutageItem {
  id: string;
  company: string;
  location: string;
  outage_date: string;
  status: string;
  cause: string;
  expected_recovery: string;
  potential_supply_impact: string;
  is_active: boolean;
}

export interface Section6PlantOutages {
  summary: {
    total_tracked_disruptions: number;
    active_disruptions: number;
    historical_disruptions: number;
    market_vulnerability: string;
  };
  outages: PlantOutageItem[];
}

export interface PeerCompetitorItem {
  id: string;
  name: string;
  country: string;
  headquarters: string;
  ticker: string;
  is_agrocel: boolean;
  bromine_capacity_mt: number;
  latest_period: string;
  segment_name: string;
  metrics: {
    bromine_segment_revenue_usd_m: number;
    consolidated_revenue_usd_m: number;
    bromine_sales_volume_mt: number;
    ebitda_margin_pct: number;
    average_realization_usd_mt: number;
    capacity_utilization_pct: number;
  };
  recent_developments: string;
  management_commentary: string;
  market_outlook: string;
}

export interface Section7Competitors {
  peer_group: string;
  competitors: PeerCompetitorItem[];
  strategic_takeaway: string;
}

export interface PriceForecastPoint {
  period: string;
  label: string;
  predicted_cif_usd_mt: number;
  lower_bound_usd: number;
  upper_bound_usd: number;
  confidence: number;
  type: string;
}

export interface Section8Forecasts {
  price_outlook: {
    direction: string;
    forecast_range_usd_mt: string;
    model_type: string;
    points: PriceForecastPoint[];
    interpretation: string;
    model_metadata?: {
      model_name: string;
      algorithm: string;
      model_version: string;
      training_cutoff: string;
      training_observations: number;
      evaluation_metrics: {
        mae_usd_mt: number;
        rmse_usd_mt: number;
        mape_pct: number;
      };
      prediction_intervals: string[];
      run_timestamp: string;
    } | null;
  };
  supply_outlook: {
    direction: string;
    key_factors: string;
    status: string;
  };
  demand_outlook: {
    direction: string;
    key_factors: string;
    status: string;
  };
  trade_outlook: {
    direction: string;
    key_factors: string;
    status: string;
  };
  market_risks: Array<{
    risk: string;
    probability: string;
    impact: string;
  }>;
}

export interface NewsOverviewItem {
  id: number;
  headline: string;
  region: string;
  publication_date: string;
  source: string;
  category: string;
  ai_summary: string;
  bromine_relevance: string;
  impact_level: string;
  reliability_grade: string;
  original_article_link: string;
}

export interface Section9News {
  required_regions: string[];
  active_filter: string;
  total_items: number;
  items: NewsOverviewItem[];
}

export interface ExecutiveOverviewComplete {
  generated_at: string;
  product: string;
  executive_market_snapshot: ExecutiveMarketSnapshot;
  section_1_price_benchmarks: Section1PriceBenchmarks;
  section_2_supply: Section2Supply;
  section_3_demand: Section3Demand;
  section_4_trade: Section4Trade;
  section_5_production: Section5Production;
  section_6_plant_outages: Section6PlantOutages;
  section_7_competitors: Section7Competitors;
  section_8_forecasts: Section8Forecasts;
  section_9_news: Section9News;
}

export interface ArbitrageSpreadPoint {
  period: string;
  month_label: string;
  cif_usd_mt: number | null;
  fx_rate: number;
  landed_parity_inr_kg: number | null;
  agrocel_realization_inr_kg: number | null;
  arbitrage_spread_inr_kg: number | null;
  spread_pct: number | null;
  status: 'SAFE_BUFFER' | 'IMPORT_RISK' | 'NEUTRAL';
  import_volume_mt: number;
  agrocel_volume_mt: number;
}

export interface LandedParityBreakdown {
  assessed_cif_inr_kg: number;
  customs_duty_inr_kg: number;
  port_handling_inr_kg: number;
  inland_freight_inr_kg: number;
  true_landed_inr_kg: number;
  true_landed_usd_mt: number;
}

export interface NegotiationCorridor {
  ceiling_price_inr_kg: number;
  target_price_inr_kg: number;
  floor_price_inr_kg: number;
  agrocel_current_realization_inr_kg: number;
  current_headroom_inr_kg: number;
  headroom_pct: number;
  recommendation_badge: string;
  commercial_guidance: string;
}

export interface ArbitrageCockpitData {
  status: string;
  benchmark_period: string;
  baseline_parameters: {
    latest_cif_usd_mt: number;
    current_fx_rate: number;
    default_bcd_pct: number;
    default_swc_pct: number;
    default_port_handling_inr_kg: number;
    default_inland_freight_inr_kg: number;
    agrocel_latest_realization_inr_kg: number;
  };
  simulation_parameters: {
    cif_usd_mt: number;
    fx_rate: number;
    bcd_pct: number;
    swc_pct: number;
    port_handling_inr_kg: number;
    inland_freight_inr_kg: number;
  };
  breakdown: LandedParityBreakdown;
  negotiation_corridor: NegotiationCorridor;
  historical_spread_series: ArbitrageSpreadPoint[];
}

export interface ExportRadarManifestItem {
  id: number;
  trade_date: string;
  company: string;
  port: string;
  destination: string;
  foreign_port: string;
  quantity_mt: number;
  fob_usd_per_mt: number;
  trade_value_usd: number;
  bill_no: string;
}

export interface ExportRadarMonthlyPoint {
  month: string;
  total_mt: number;
  china_mt: number;
  other_mt: number;
  china_share_pct: number;
  fob_usd_mt: number;
  total_usd: number;
  shipments: number;
}

export interface ExportRadarSummary {
  total_historical_volume_mt: number;
  total_shipments: number;
  latest_month: string;
  latest_month_volume_mt: number;
  latest_month_fob_usd_mt: number;
  trailing_3m_avg_mt: number;
  trailing_6m_avg_mt: number;
  baseline_export_target_mt: number;
  china_share_pct: number;
  diversion_risk_level: 'ELEVATED' | 'MODERATE' | 'LOW';
  diversion_risk_badge: string;
  estimated_domestic_spillover_mt: number;
  threat_narrative: string;
  commercial_action: string;
}

export interface CompetitorExportRadarData {
  selected_company: 'ARCHEAN' | 'SATYESH' | 'ALL';
  company_display_name: string;
  plant_location: string;
  export_port: string;
  primary_destination: string;
  summary: ExportRadarSummary;
  monthly_series: ExportRadarMonthlyPoint[];
  recent_manifests: ExportRadarManifestItem[];
}


