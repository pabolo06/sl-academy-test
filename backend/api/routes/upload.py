"""
SL Academy Platform - File Upload Routes
Handles secure file uploads to Supabase Storage
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from pydantic import BaseModel
from utils.session import get_current_user
from utils.file_validation import file_validator
from utils.rate_limiter import rate_limiter, _get_client_ip

UPLOAD_MAX_PER_HOUR = 20
UPLOAD_WINDOW_SECONDS = 60 * 60
from core.database import get_db
from core.config import settings
from supabase import Client
import logging
import pandas as pd
from io import BytesIO

logger = logging.getLogger(__name__)

router = APIRouter()


class UploadResponse(BaseModel):
    """File upload response"""
    url: str
    filename: str


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Upload image file to Supabase Storage

    - **file**: Image file (JPEG, PNG, WebP, max 5MB)

    Validates file size and type using magic bytes
    Generates random filename for security
    Uploads to Supabase Storage with RLS
    Returns signed URL
    """
    try:
        ip = _get_client_ip(request)
        is_allowed, retry_after = await rate_limiter.check_rate_limit(
            identifier=f"upload:{ip}:{current_user['user_id']}",
            max_requests=UPLOAD_MAX_PER_HOUR,
            window_seconds=UPLOAD_WINDOW_SECONDS,
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        # Validate image
        mime_type, random_filename = await file_validator.validate_image(file)
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        # Storage bucket: 'images'
        # Path: {hospital_id}/{random_filename}
        storage_path = f"{current_user['hospital_id']}/{random_filename}"
        
        try:
            db.storage.from_("images").upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": mime_type}
            )
        except Exception as e:
            logger.error(f"Supabase storage upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
        
        # Log file upload
        from utils.audit_logger import audit_logger
        await audit_logger.log_file_upload(
            db=db,
            user_id=current_user["user_id"],
            hospital_id=current_user["hospital_id"],
            filename=random_filename,
            file_type=mime_type,
            file_size=len(file_content)
        )
        
        # Get signed URL (valid for 1 year)
        signed_url_response = db.storage.from_("images").create_signed_url(
            path=storage_path,
            expires_in=31536000  # 1 year in seconds
        )
        
        signed_url = signed_url_response.get("signedURL")
        
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate signed URL"
            )
        
        logger.info(
            f"Image uploaded: {random_filename} by {current_user['email']}"
        )
        
        return UploadResponse(
            url=signed_url,
            filename=random_filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while uploading image"
        )


@router.post("/spreadsheet")
async def upload_spreadsheet(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and parse spreadsheet file

    - **file**: Spreadsheet file (CSV, XLSX, max 10MB)

    Validates file size and type using magic bytes
    Parses file in sandboxed environment
    Limits to 10,000 rows
    Returns parsed data
    """
    try:
        ip = _get_client_ip(request)
        is_allowed, retry_after = await rate_limiter.check_rate_limit(
            identifier=f"upload:{ip}:{current_user['user_id']}",
            max_requests=UPLOAD_MAX_PER_HOUR,
            window_seconds=UPLOAD_WINDOW_SECONDS,
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many upload requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        # Validate spreadsheet
        mime_type, random_filename = await file_validator.validate_spreadsheet(file)
        
        # Read file content
        file_content = await file.read()
        
        # Parse spreadsheet based on type
        try:
            if mime_type == "text/csv":
                df = pd.read_csv(BytesIO(file_content))
            else:  # Excel files
                df = pd.read_excel(BytesIO(file_content))
        except Exception as e:
            logger.error(f"Failed to parse spreadsheet: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to parse spreadsheet. Please check file format."
            )
        
        # Limit to 10,000 rows
        if len(df) > 10000:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Spreadsheet exceeds 10,000 row limit"
            )
        
        # Convert to list of dicts
        data = df.to_dict(orient="records")
        
        logger.info(
            f"Spreadsheet parsed: {len(data)} rows by {current_user['email']}"
        )
        
        return {
            "rows": len(data),
            "columns": list(df.columns),
            "data": data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing spreadsheet: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing spreadsheet"
        )
