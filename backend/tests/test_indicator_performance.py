
import pytest
from unittest.mock import Mock, patch
from services.indicators import IndicatorImportService
from models.indicators import IndicatorImportRow
import asyncio
import time

@pytest.mark.asyncio
async def test_indicator_import_batch_performance():
    """
    Test the performance and correctness of the batch upsert logic.
    """
    service = IndicatorImportService()
    mock_db = Mock()
    hospital_id = "test-hospital-id"
    
    # Create 100 dummy indicator rows
    indicators = [
        IndicatorImportRow(
            name=f"Indicator {i}",
            category="Quality",
            value=float(i),
            reference_date="2024-03-18",
            unit="%",
            notes="Test note"
        ) for i in range(100)
    ]
    
    # Mock the Supabase chain
    mock_table = Mock()
    mock_db.table.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    
    # Simulate a successful response with 100 rows
    mock_response = Mock()
    mock_response.data = [{"id": f"id-{i}"} for i in range(100)]
    mock_table.execute.return_value = mock_response
    
    # Measure execution time
    start_time = time.perf_counter()
    result = await service.import_indicators(mock_db, hospital_id, indicators)
    end_time = time.perf_counter()
    
    # Assertions
    assert result.success_count == 100
    assert result.error_count == 0
    assert len(result.errors) == 0
    
    # Verify mock calls
    mock_db.table.assert_called_with("indicators")
    # Should only call table once for the whole batch
    assert mock_db.table.call_count == 1
    
    duration = end_time - start_time
    print(f"\nImported 100 indicators in {duration:.4f} seconds")

@pytest.mark.asyncio
async def test_indicator_import_validation_errors():
    """
    Test that invalid rows are collected as errors and don't stop the process.
    """
    service = IndicatorImportService()
    mock_db = Mock()
    hospital_id = "test-hospital-id"
    
    # 2 valid rows, 1 invalid row
    indicators = [
        IndicatorImportRow(name="Valid 1", category="Cat", value=1.0, reference_date="2024-03-18"),
        IndicatorImportRow(name="Invalid", category="Cat", value=2.0, reference_date="invalid-date"),
        IndicatorImportRow(name="Valid 2", category="Cat", value=3.0, reference_date="2024-03-18")
    ]
    
    mock_table = Mock()
    mock_db.table.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    
    mock_response = Mock()
    mock_response.data = [{"id": "1"}, {"id": "2"}]
    mock_table.execute.return_value = mock_response
    
    result = await service.import_indicators(mock_db, hospital_id, indicators)
    
    assert result.success_count == 2
    assert result.error_count == 1
    assert "Invalid date format" in result.errors[0].error
    assert result.errors[0].row == 2
