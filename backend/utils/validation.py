"""
SL Academy Platform - Input Validation Utilities
Validates and sanitizes user input
"""

from fastapi import HTTPException, status
from uuid import UUID
from typing import Optional
import re


class ValidationError(HTTPException):
    """Custom validation error"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


def validate_uuid(value: str, field_name: str = "ID") -> UUID:
    """
    Validate UUID format
    
    Args:
        value: String to validate
        field_name: Field name for error message
    
    Returns:
        UUID object
    
    Raises:
        ValidationError: If invalid UUID format
    """
    try:
        return UUID(value)
    except (ValueError, AttributeError):
        raise ValidationError(f"Invalid {field_name} format. Must be a valid UUID.")


def validate_email(email: str) -> str:
    """
    Validate email format
    
    Args:
        email: Email string to validate
    
    Returns:
        Validated email string
    
    Raises:
        ValidationError: If invalid email format
    """
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format.")
    
    return email.lower()


def validate_url(url: str, allowed_domains: Optional[list] = None) -> str:
    """
    Validate URL format and optionally check domain
    
    Args:
        url: URL string to validate
        allowed_domains: Optional list of allowed domains
    
    Returns:
        Validated URL string
    
    Raises:
        ValidationError: If invalid URL format or domain
    """
    url_pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    
    if not re.match(url_pattern, url):
        raise ValidationError("Invalid URL format. Must be a valid HTTP/HTTPS URL.")
    
    if allowed_domains:
        domain_match = re.search(r'https?://([a-zA-Z0-9.-]+)', url)
        if domain_match:
            domain = domain_match.group(1)
            if not any(domain.endswith(allowed) for allowed in allowed_domains):
                raise ValidationError(
                    f"URL domain not allowed. Must be from: {', '.join(allowed_domains)}"
                )
    
    return url


def validate_numeric_range(
    value: float,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
    field_name: str = "Value"
) -> float:
    """
    Validate numeric value is within range
    
    Args:
        value: Numeric value to validate
        min_value: Optional minimum value
        max_value: Optional maximum value
        field_name: Field name for error message
    
    Returns:
        Validated numeric value
    
    Raises:
        ValidationError: If value out of range
    """
    if min_value is not None and value < min_value:
        raise ValidationError(
            f"{field_name} must be greater than or equal to {min_value}."
        )
    
    if max_value is not None and value > max_value:
        raise ValidationError(
            f"{field_name} must be less than or equal to {max_value}."
        )
    
    return value


def validate_string_length(
    value: str,
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    field_name: str = "Field"
) -> str:
    """
    Validate string length
    
    Args:
        value: String to validate
        min_length: Optional minimum length
        max_length: Optional maximum length
        field_name: Field name for error message
    
    Returns:
        Validated string
    
    Raises:
        ValidationError: If length out of range
    """
    length = len(value)
    
    if min_length is not None and length < min_length:
        raise ValidationError(
            f"{field_name} must be at least {min_length} characters long."
        )
    
    if max_length is not None and length > max_length:
        raise ValidationError(
            f"{field_name} must be at most {max_length} characters long."
        )
    
    return value
