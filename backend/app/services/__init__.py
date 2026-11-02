"""
Agrocel Market Intelligence - Shared Analytical Services Package
Unified single-source-of-truth analytical foundation for:
  - Base services (date parsing, common date horizon, overview stats, data sources summary)
  - Currency conversion (period-aware RBI reference rates)
  - Standardized KPIs (verifiable DynamicKPIMetric schema with explicit data status)
  - Econometric Forecasting (real persisted model outputs, MAE/RMSE/MAPE, prediction intervals)
  - Market Balance Engine (empirical calculation from trade momentum, price slope, disruptions)
  - Outage & Disruption Register (structured event lifecycle tracking)
  - Competitor Intelligence (dynamic financial disclosures & management commentary)
"""

# Base Services
from .base_service import (
    parse_date_opt,
    get_latest_common_date,
    get_latest_common_month_range,
    overview,
    get_data_sources_summary
)

# Currency Services
from .currency_service import (
    get_usd_inr_rate,
    get_rate_metadata,
    convert_inr_to_usd,
    convert_usd_to_inr,
    get_financial_year,
    RBI_ANNUAL_FY_RATES,
    RBI_MONTHLY_RATES
)

# Standardized KPI Services
from .kpi_service import (
    DynamicKPIMetric,
    build_dynamic_kpi,
    unavailable_kpi,
    DATA_STATUS_VERIFIED,
    DATA_STATUS_CALCULATED,
    DATA_STATUS_ESTIMATED,
    DATA_STATUS_STALE,
    DATA_STATUS_INCOMPLETE,
    DATA_STATUS_UNAVAILABLE,
    DATA_STATUS_FAILED
)

# Forecasting Engine
from .forecasting_engine import (
    get_persisted_forecast_run,
    get_historical_monthly_cif,
    train_and_forecast_econometric,
    MODEL_NAME as FORECAST_MODEL_NAME,
    MODEL_VERSION as FORECAST_MODEL_VERSION
)

# Market Balance Engine
from .market_balance_engine import (
    calculate_dynamic_market_balance
)

# Outage & Disruption Services
from .outage_service import (
    get_dynamic_outages_register,
    VERIFIED_OUTAGES_REGISTER
)

# Competitor Intelligence Services
from .competitor_service import (
    get_dynamic_competitors_overview
)

__all__ = [
    # Base
    "parse_date_opt",
    "get_latest_common_date",
    "get_latest_common_month_range",
    "overview",
    "get_data_sources_summary",
    # Currency
    "get_usd_inr_rate",
    "get_rate_metadata",
    "convert_inr_to_usd",
    "convert_usd_to_inr",
    "get_financial_year",
    "RBI_ANNUAL_FY_RATES",
    "RBI_MONTHLY_RATES",
    # KPI
    "DynamicKPIMetric",
    "build_dynamic_kpi",
    "unavailable_kpi",
    "DATA_STATUS_VERIFIED",
    "DATA_STATUS_CALCULATED",
    "DATA_STATUS_ESTIMATED",
    "DATA_STATUS_STALE",
    "DATA_STATUS_INCOMPLETE",
    "DATA_STATUS_UNAVAILABLE",
    "DATA_STATUS_FAILED",
    # Forecasting
    "get_persisted_forecast_run",
    "get_historical_monthly_cif",
    "train_and_forecast_econometric",
    "FORECAST_MODEL_NAME",
    "FORECAST_MODEL_VERSION",
    # Market Balance
    "calculate_dynamic_market_balance",
    # Outages
    "get_dynamic_outages_register",
    "VERIFIED_OUTAGES_REGISTER",
    # Competitors
    "get_dynamic_competitors_overview"
]
