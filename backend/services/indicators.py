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
    """Service for importing indicators with validation and upsert"""
    
    @staticmethod
    async def import_indicators(
        db: Client,
        hospital_id: str,
        indicators: List[IndicatorImportRow]
    ) -> IndicatorImportResult:
        """
        Import indicators with validation and upsert logic
        
        Args:
            db: Supabase client
            hospital_id: Hospital UUID
            indicators: List of indicator rows to import
        
        Returns:
            IndicatorImportResult with success/error counts and details
        """
        success_count = 0
        errors: List[IndicatorImportError] = []
        
        for idx, indicator_row in enumerate(indicators, start=1):
            try:
                # Validate and parse reference_date
                try:
                    reference_date = datetime.strptime(
                        indicator_row.reference_date, "%Y-%m-%d"
                    ).date()
                except ValueError:
                    raise ValueError(f"Invalid date format: {indicator_row.reference_date}. Expected YYYY-MM-DD")
                
                # Validate required fields
                if not indicator_row.name or not indicator_row.name.strip():
                    raise ValueError("Name is required")
                
                if not indicator_row.category or not indicator_row.category.strip():
                    raise ValueError("Category is required")
                
                # Check for duplicate (same name + reference_date)
                existing = db.table("indicators").select("id").eq(
                    "hospital_id", hospital_id
                ).eq("name", indicator_row.name).eq(
                    "reference_date", reference_date.isoformat()
                ).eq("deleted_at", None).execute()
                
                indicator_data = {
                    "hospital_id": hospital_id,
                    "name": indicator_row.name.strip(),
                    "category": indicator_row.category.strip(),
                    "value": indicator_row.value,
                    "reference_date": reference_date.isoformat(),
                    "unit": indicator_row.unit.strip() if indicator_row.unit else None,
                    "notes": indicator_row.notes.strip() if indicator_row.notes else None
                }
                
                if existing.data:
                    # Update existing indicator
                    db.table("indicators").update(indicator_data).eq(
                        "id", existing.data[0]["id"]
                    ).execute()
                else:
                    # Create new indicator
                    db.table("indicators").insert(indicator_data).execute()
                
                success_count += 1
            
            except Exception as e:
                errors.append(IndicatorImportError(
                    row=idx,
                    error=str(e),
                    data={
                        "name": indicator_row.name,
                        "category": indicator_row.category,
                        "reference_date": indicator_row.reference_date
                    }
                ))
                logger.warning(f"Error importing indicator row {idx}: {str(e)}")
        
        return IndicatorImportResult(
            success_count=success_count,
            error_count=len(errors),
            errors=errors
        )


# Global indicator import service instance
indicator_import_service = IndicatorImportService()
