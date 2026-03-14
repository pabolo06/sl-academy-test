"""
SL Academy Platform - Audit Logging
Logs security-relevant events for compliance and monitoring
"""

from supabase import Client
from datetime import datetime
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class AuditLogger:
    """Audit logging service"""
    
    EVENT_TYPES = {
        "AUTH_LOGIN_SUCCESS": "Authentication - Login Success",
        "AUTH_LOGIN_FAILURE": "Authentication - Login Failure",
        "AUTH_LOGOUT": "Authentication - Logout",
        "AUTHZ_FORBIDDEN": "Authorization - Forbidden Access",
        "RLS_VIOLATION": "RLS - Policy Violation",
        "FILE_UPLOAD": "File - Upload",
        "INDICATOR_IMPORT": "Indicator - Import",
        "CROSS_HOSPITAL_ACCESS": "Security - Cross-Hospital Access Attempt",
        "ACCOUNT_DELETION": "Account - Permanent Deletion (GDPR)"
    }
    
    @staticmethod
    async def log_event(
        db: Client,
        event_type: str,
        user_id: Optional[str],
        hospital_id: Optional[str],
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log audit event
        
        Args:
            db: Supabase client
            event_type: Event type key
            user_id: User UUID (if authenticated)
            hospital_id: Hospital UUID (if applicable)
            details: Additional event details
            ip_address: Client IP address
            user_agent: Client user agent
        """
        try:
            event_description = AuditLogger.EVENT_TYPES.get(
                event_type,
                "Unknown Event"
            )
            
            audit_data = {
                "event_type": event_type,
                "event_description": event_description,
                "user_id": user_id,
                "hospital_id": hospital_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Log to database
            db.table("audit_logs").insert(audit_data).execute()
            
            # Also log to application logger
            logger.info(
                f"AUDIT: {event_description} | "
                f"User: {user_id or 'N/A'} | "
                f"Hospital: {hospital_id or 'N/A'} | "
                f"IP: {ip_address or 'N/A'}"
            )
        
        except Exception as e:
            # Don't fail the request if audit logging fails
            logger.error(f"Failed to log audit event: {str(e)}")
    
    @staticmethod
    async def log_auth_success(
        db: Client,
        user_id: str,
        hospital_id: str,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Log successful authentication"""
        await AuditLogger.log_event(
            db=db,
            event_type="AUTH_LOGIN_SUCCESS",
            user_id=user_id,
            hospital_id=hospital_id,
            details={"email": email},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_auth_failure(
        db: Client,
        email: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Log failed authentication attempt"""
        await AuditLogger.log_event(
            db=db,
            event_type="AUTH_LOGIN_FAILURE",
            user_id=None,
            hospital_id=None,
            details={"email": email, "reason": reason},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    async def log_authz_failure(
        db: Client,
        user_id: str,
        hospital_id: str,
        resource: str,
        action: str,
        ip_address: Optional[str] = None
    ) -> None:
        """Log authorization failure"""
        await AuditLogger.log_event(
            db=db,
            event_type="AUTHZ_FORBIDDEN",
            user_id=user_id,
            hospital_id=hospital_id,
            details={"resource": resource, "action": action},
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_file_upload(
        db: Client,
        user_id: str,
        hospital_id: str,
        filename: str,
        file_type: str,
        file_size: int,
        ip_address: Optional[str] = None
    ) -> None:
        """Log file upload"""
        await AuditLogger.log_event(
            db=db,
            event_type="FILE_UPLOAD",
            user_id=user_id,
            hospital_id=hospital_id,
            details={
                "filename": filename,
                "file_type": file_type,
                "file_size": file_size
            },
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_indicator_import(
        db: Client,
        user_id: str,
        hospital_id: str,
        success_count: int,
        error_count: int,
        ip_address: Optional[str] = None
    ) -> None:
        """Log indicator import"""
        await AuditLogger.log_event(
            db=db,
            event_type="INDICATOR_IMPORT",
            user_id=user_id,
            hospital_id=hospital_id,
            details={
                "success_count": success_count,
                "error_count": error_count
            },
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_cross_hospital_access(
        db: Client,
        user_id: str,
        user_hospital_id: str,
        attempted_hospital_id: str,
        resource: str,
        ip_address: Optional[str] = None
    ) -> None:
        """Log cross-hospital access attempt"""
        await AuditLogger.log_event(
            db=db,
            event_type="CROSS_HOSPITAL_ACCESS",
            user_id=user_id,
            hospital_id=user_hospital_id,
            details={
                "attempted_hospital_id": attempted_hospital_id,
                "resource": resource
            },
            ip_address=ip_address
        )
    
    @staticmethod
    async def log_account_deletion(
        db: Client,
        user_id: str,
        email: str,
        hospital_id: str,
        test_attempts_deleted: int,
        doubts_deleted: int,
        doubts_anonymized: int,
        ip_address: Optional[str] = None
    ) -> None:
        """Log account deletion for GDPR compliance"""
        await AuditLogger.log_event(
            db=db,
            event_type="ACCOUNT_DELETION",
            user_id=user_id,
            hospital_id=hospital_id,
            details={
                "email": email,
                "test_attempts_deleted": test_attempts_deleted,
                "doubts_deleted": doubts_deleted,
                "doubts_anonymized": doubts_anonymized,
                "deletion_timestamp": datetime.utcnow().isoformat()
            },
            ip_address=ip_address
        )


# Global audit logger instance
audit_logger = AuditLogger()
