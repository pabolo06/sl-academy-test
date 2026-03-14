"""
Unit tests for the IndicatorImportService
"""

import pytest
from unittest.mock import MagicMock, call, ANY
from datetime import date
from uuid import uuid4

from services.indicators import IndicatorImportService
from models.indicators import IndicatorImportRow


@pytest.fixture
def mock_db():
    """Fixture to provide a mocked Supabase client."""
    return MagicMock()


@pytest.mark.asyncio
async def test_import_indicators_empty_list(mock_db):
    """
    Test that importing an empty list results in 0 successes and 0 errors.
    """
    hospital_id = str(uuid4())
    indicators = []

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 0
    assert result.error_count == 0
    assert not result.errors
    mock_db.table.assert_not_called()


@pytest.mark.asyncio
async def test_import_indicators_creates_new_indicator(mock_db):
    """
    Test that a new indicator is created when no existing one is found.
    """
    hospital_id = str(uuid4())
    indicators = [
        IndicatorImportRow(
            name="New Indicator",
            category="Safety",
            value=99.5,
            reference_date="2024-01-01"
        )
    ]

    # Mock the check for an existing indicator to return no data
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 1
    assert result.error_count == 0

    # Verify that insert was called and update was not
    mock_db.table.return_value.insert.assert_called_once_with(ANY)
    mock_db.table.return_value.update.assert_not_called()


@pytest.mark.asyncio
async def test_import_indicators_updates_existing_indicator(mock_db):
    """
    Test that an existing indicator is updated if found.
    """
    hospital_id = str(uuid4())
    existing_id = str(uuid4())
    indicators = [
        IndicatorImportRow(
            name="Existing Indicator",
            category="Efficiency",
            value=120.0,
            reference_date="2024-02-15"
        )
    ]

    # Mock the check for an existing indicator to return an ID
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{'id': existing_id}]

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 1
    assert result.error_count == 0

    # Verify that update was called and insert was not
    mock_db.table.return_value.update.assert_called_once_with(ANY)
    mock_db.table.return_value.insert.assert_not_called()
    # Check that the update was targeted at the correct existing ID
    mock_db.table.return_value.update.return_value.eq.assert_called_once_with("id", existing_id)


@pytest.mark.asyncio
async def test_import_indicators_with_invalid_date_format(mock_db):
    """
    Test that a row with an invalid date format is rejected.
    """
    hospital_id = str(uuid4())
    indicators = [
        IndicatorImportRow(
            name="Bad Date",
            category="Quality",
            value=10,
            reference_date="01-01-2024"  # Invalid format
        )
    ]

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 0
    assert result.error_count == 1
    assert len(result.errors) == 1
    assert result.errors[0].row == 1
    assert "Invalid date format" in result.errors[0].error
    mock_db.table.return_value.insert.assert_not_called()
    mock_db.table.return_value.update.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("name, category", [
    (None, "Valid Category"),
    ("", "Valid Category"),
    ("   ", "Valid Category"),
    ("Valid Name", None),
    ("Valid Name", ""),
    ("Valid Name", "   "),
])
async def test_import_indicators_with_missing_required_fields(mock_db, name, category):
    """
    Test that rows with missing or empty required fields (name, category) are rejected.
    """
    hospital_id = str(uuid4())
    indicators = [
        IndicatorImportRow(
            name=name,
            category=category,
            value=50,
            reference_date="2024-03-01"
        )
    ]

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 0
    assert result.error_count == 1
    assert len(result.errors) == 1
    assert result.errors[0].row == 1
    assert ("Name is required" in result.errors[0].error or "Category is required" in result.errors[0].error)


@pytest.mark.asyncio
async def test_import_indicators_mixed_success_and_failure(mock_db):
    """
    Test importing a list with both valid and invalid indicators.
    """
    hospital_id = str(uuid4())
    indicators = [
        # Valid row - will be created
        IndicatorImportRow(name="Success Row", category="Cat A", value=1, reference_date="2024-04-01"),
        # Invalid row - bad date
        IndicatorImportRow(name="Failure Row 1", category="Cat B", value=2, reference_date="2024/04/02"),
        # Valid row - will be updated
        IndicatorImportRow(name="Update Row", category="Cat C", value=3, reference_date="2024-04-03"),
        # Invalid row - missing name
        IndicatorImportRow(name="", category="Cat D", value=4, reference_date="2024-04-04"),
    ]

    # Mock DB responses
    # First call (Success Row) -> not found, so create
    # Second call (Update Row) -> found, so update
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.side_effect = [
        MagicMock(data=[]),  # For "Success Row"
        MagicMock(data=[{'id': str(uuid4())}]), # For "Update Row"
    ]

    result = await IndicatorImportService.import_indicators(mock_db, hospital_id, indicators)

    assert result.success_count == 2
    assert result.error_count == 2
    assert len(result.errors) == 2

    # Check error details
    assert result.errors[0].row == 2
    assert "Invalid date format" in result.errors[0].error
    assert result.errors[1].row == 4
    assert "Name is required" in result.errors[1].error

    # Verify DB calls
    assert mock_db.table.return_value.insert.call_count == 1
    assert mock_db.table.return_value.update.call_count == 1