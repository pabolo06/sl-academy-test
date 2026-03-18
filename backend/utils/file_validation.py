"""
SL Academy Platform - File Validation Utilities
Validates file size, type, and generates secure filenames
"""

from fastapi import HTTPException, UploadFile, status
import secrets
import string
from pathlib import Path
from typing import List, Tuple
import mimetypes

# Try to import magic, but provide fallback for Windows
try:
    import magic
    MAGIC_AVAILABLE = True
except (ImportError, OSError):
    MAGIC_AVAILABLE = False
    print("Warning: python-magic not available, using fallback MIME detection")


class FileValidator:
    """File validation utilities"""
    
    # Allowed MIME types
    ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]
    
    ALLOWED_SPREADSHEET_TYPES = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
    
    # File size limits (in bytes)
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_SPREADSHEET_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def validate_file_size(file: UploadFile, max_size: int, file_type: str = "file") -> None:
        """
        Validate file size
        
        Args:
            file: Uploaded file
            max_size: Maximum size in bytes
            file_type: File type name for error message
        
        Raises:
            HTTPException: If file size exceeds limit
        """
        # Read file to check size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{file_type.capitalize()} size exceeds {max_size_mb}MB limit"
            )
    
    @staticmethod
    def validate_file_type(
        file: UploadFile,
        allowed_types: List[str],
        file_type: str = "file"
    ) -> str:
        """
        Validate file type using magic bytes or fallback to extension
        
        Args:
            file: Uploaded file
            allowed_types: List of allowed MIME types
            file_type: File type name for error message
        
        Returns:
            Detected MIME type
        
        Raises:
            HTTPException: If file type not allowed
        """
        mime = None
        
        if MAGIC_AVAILABLE:
            # Read first 2048 bytes for magic byte detection
            file.file.seek(0)
            file_header = file.file.read(2048)
            file.file.seek(0)
            
            # Detect MIME type from magic bytes
            mime = magic.from_buffer(file_header, mime=True)
        else:
            # Fallback: use file extension and content_type
            # First try the content_type from the upload
            if file.content_type and file.content_type in allowed_types:
                mime = file.content_type
            else:
                # Try to guess from filename
                guessed_type, _ = mimetypes.guess_type(file.filename)
                if guessed_type:
                    mime = guessed_type
        
        if not mime or mime not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid {file_type} type. Allowed types: {', '.join(allowed_types)}"
            )
        
        return mime
    
    @staticmethod
    def generate_random_filename(original_filename: str) -> str:
        """
        Generate random filename while preserving extension
        
        Args:
            original_filename: Original filename
        
        Returns:
            Random filename with original extension
        """
        # Get file extension
        extension = Path(original_filename).suffix.lower()
        
        # Generate random name (32 characters)
        random_name = ''.join(
            secrets.choice(string.ascii_lowercase + string.digits)
            for _ in range(32)
        )
        
        return f"{random_name}{extension}"
    
    @staticmethod
    async def validate_image(file: UploadFile) -> Tuple[str, str]:
        """
        Validate image file
        
        Args:
            file: Uploaded image file
        
        Returns:
            Tuple of (mime_type, random_filename)
        
        Raises:
            HTTPException: If validation fails
        """
        # Validate size
        FileValidator.validate_file_size(
            file,
            FileValidator.MAX_IMAGE_SIZE,
            "image"
        )
        
        # Validate type
        mime_type = FileValidator.validate_file_type(
            file,
            FileValidator.ALLOWED_IMAGE_TYPES,
            "image"
        )
        
        # Generate random filename
        random_filename = FileValidator.generate_random_filename(file.filename)
        
        return mime_type, random_filename
    
    @staticmethod
    async def validate_spreadsheet(file: UploadFile) -> Tuple[str, str]:
        """
        Validate spreadsheet file
        
        Args:
            file: Uploaded spreadsheet file
        
        Returns:
            Tuple of (mime_type, random_filename)
        
        Raises:
            HTTPException: If validation fails
        """
        # Validate size
        FileValidator.validate_file_size(
            file,
            FileValidator.MAX_SPREADSHEET_SIZE,
            "spreadsheet"
        )
        
        # Validate type
        mime_type = FileValidator.validate_file_type(
            file,
            FileValidator.ALLOWED_SPREADSHEET_TYPES,
            "spreadsheet"
        )
        
        # Generate random filename
        random_filename = FileValidator.generate_random_filename(file.filename)
        
        return mime_type, random_filename


# Global file validator instance
file_validator = FileValidator()
