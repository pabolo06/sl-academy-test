"""
SL Academy Platform - Indicator Import Service
Handles indicator validation and import with upsert logic
"""

from typing import List, Dict
from datetime import datetime
from models.indicators import IndicatorImportRow, IndicatorImportResult, IndicatorImportError
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class IndicatorImportService:
    """Service for importing indicators with validation and efficient batch upsert"""
    
    @staticmethod
    async def import_indicators(
        db: Client,
        hospital_id: str,
        indicators: List[IndicatorImportRow]
    ) -> IndicatorImportResult:
        """
        Import indicators with validation and efficient batch upsert logic
        """
        success_count = 0
        errors: List[IndicatorImportError] = []
        valid_indicators_data = []

        # 1. Validation and Data Preparation
        for idx, row in enumerate(indicators, start=1):
            try:
                # Validate date
                try:
                    reference_date = datetime.strptime(row.reference_date, "%Y-%m-%d").date()
                except ValueError:
                    raise ValueError(f"Invalid date format: {row.reference_date}. Expected YYYY-MM-DD")
                
                if not row.name or not row.name.strip():
                    raise ValueError("Name is required")
                
                if not row.category or not row.category.strip():
                    raise ValueError("Category is required")

                valid_indicators_data.append({
                    "hospital_id": hospital_id,
                    "name": row.name.strip(),
                    "category": row.category.strip(),
                    "value": row.value,
                    "reference_date": reference_date.isoformat(),
                    "unit": row.unit.strip() if row.unit else None,
                    "notes": row.notes.strip() if row.notes else None
                })
            except Exception as e:
                errors.append(IndicatorImportError(
                    row=idx,
                    error=str(e),
                    data=row.dict()
                ))

        # 2. Batch Upsert into Database
        if valid_indicators_data:
            try:
                # Upsert based on (hospital_id, name, reference_date)
                # Note: This is most efficient with a unique constraint in the DB
                response = db.table("indicators").upsert(
                    valid_indicators_data,
                    on_conflict="hospital_id, name, reference_date"
                ).execute()
                
                success_count = len(response.data) if response.data else 0
            except Exception as e:
                logger.error(f"Error during batch upsert: {str(e)}")
                errors.append(IndicatorImportError(
                    row=0,
                    error=f"Batch operation failed: {str(e)}",
                    data={}
                ))

        return IndicatorImportResult(
            success_count=success_count,
            error_count=len(errors),
            errors=errors
        )


# Global indicator import service instance
indicator_import_service = IndicatorImportService()
