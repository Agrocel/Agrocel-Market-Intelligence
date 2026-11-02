"""
Agrocel Market Intelligence - Standardized KPI Analytical Service
Enforces transparent, auditable business KPI schemas across all pages.
Eliminates silent fallback numbers and arbitrary defaults.
Complies with Enterprise Data Quality & Provenance standards.
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field

# Supported Data Quality & Freshness States
DATA_STATUS_VERIFIED = "verified"       # Formally reconciled against audited source records
DATA_STATUS_CALCULATED = "calculated"   # Derived deterministically from verified records
DATA_STATUS_ESTIMATED = "estimated"     # Statistically modeled or documented industry estimate
DATA_STATUS_STALE = "stale"             # Historical record beyond expected freshness threshold
DATA_STATUS_INCOMPLETE = "incomplete"   # Partial source coverage; calculation cannot complete
DATA_STATUS_UNAVAILABLE = "unavailable" # No source records exist; explicit null representation
DATA_STATUS_FAILED = "failed"           # Pipeline or extraction execution encountered an error

class DynamicKPIMetric(BaseModel):
    """
    Standardized Enterprise Management KPI Schema.
    Never conceals missing data with arbitrary numbers.
    """
    metric_id: str
    label: str
    value: Optional[float] = None
    unit: str
    period: Optional[str] = None
    previous_period_value: Optional[float] = None
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None
    source_ids: List[str] = Field(default_factory=list)
    calculation_method: Optional[str] = None
    data_status: str = DATA_STATUS_UNAVAILABLE
    status_note: Optional[str] = None
    last_updated: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_id": self.metric_id,
            "label": self.label,
            "value": round(self.value, 2) if self.value is not None else None,
            "unit": self.unit,
            "period": self.period,
            "previous_period_value": round(self.previous_period_value, 2) if self.previous_period_value is not None else None,
            "absolute_change": round(self.absolute_change, 2) if self.absolute_change is not None else None,
            "percentage_change": round(self.percentage_change, 1) if self.percentage_change is not None else None,
            "source_ids": self.source_ids,
            "calculation_method": self.calculation_method,
            "data_status": self.data_status,
            "status_note": self.status_note,
            "last_updated": self.last_updated or datetime.utcnow().isoformat()
        }

def build_dynamic_kpi(
    metric_id: str,
    label: str,
    value: Optional[float],
    unit: str,
    period: Optional[str] = None,
    previous_period_value: Optional[float] = None,
    source_ids: Optional[List[str]] = None,
    calculation_method: Optional[str] = None,
    data_status: Optional[str] = None,
    status_note: Optional[str] = None,
    last_updated: Optional[Union[str, datetime, date]] = None
) -> DynamicKPIMetric:
    """
    Constructs a verified DynamicKPIMetric.
    Automatically computes absolute and percentage changes if previous value is provided.
    If value is None, forces data_status to 'unavailable' or 'incomplete'.
    """
    sources = source_ids or []
    
    if value is None:
        actual_status = data_status or DATA_STATUS_UNAVAILABLE
        actual_note = status_note or f"Metric {label} is unavailable for period {period or 'current'} - no verified source records."
        abs_change = None
        pct_change = None
    else:
        actual_status = data_status or DATA_STATUS_CALCULATED
        actual_note = status_note
        abs_change = None
        pct_change = None
        if previous_period_value is not None:
            abs_change = value - previous_period_value
            if previous_period_value != 0:
                pct_change = ((value - previous_period_value) / abs(previous_period_value)) * 100.0

    if isinstance(last_updated, (datetime, date)):
        updated_str = last_updated.isoformat()
    elif isinstance(last_updated, str):
        updated_str = last_updated
    else:
        updated_str = datetime.utcnow().isoformat()

    return DynamicKPIMetric(
        metric_id=metric_id,
        label=label,
        value=value,
        unit=unit,
        period=period,
        previous_period_value=previous_period_value,
        absolute_change=abs_change,
        percentage_change=pct_change,
        source_ids=sources,
        calculation_method=calculation_method,
        data_status=actual_status,
        status_note=actual_note,
        last_updated=updated_str
    )

def unavailable_kpi(metric_id: str, label: str, unit: str, reason: str = "No records found") -> DynamicKPIMetric:
    """Helper to return an honest unavailable metric without inventing a fake number."""
    return build_dynamic_kpi(
        metric_id=metric_id,
        label=label,
        value=None,
        unit=unit,
        data_status=DATA_STATUS_UNAVAILABLE,
        status_note=reason
    )
