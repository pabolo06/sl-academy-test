"""
SL Academy Platform - Authentication Routes
Handles user login, logout, and session management
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from models.auth import LoginRequest, LoginResponse, LogoutResponse, UserDataExport
from utils.session import session_manager, get_current_user
from utils.rate_limiter import check_login_rate_limit
from core.database import get_db
from supabase import Client
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    response: Response,
    credentials: LoginRequest,
    _rate_limit: None = Depends(check_login_rate_limit),
    db: Client = Depends(get_db)
):
    """
    Authenticate user and create session
    
    - **email**: User email address
    - **password**: User password
    - **accept_terms**: User consent to terms and privacy policy
    
    Returns encrypted session cookie with user data
    """
    try:
        # Validate consent
        if not credentials.accept_terms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must accept the terms of service and privacy policy"
            )
        
        # Authenticate with Supabase Auth
        auth_response = db.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user:
            # Log failed attempt
            from utils.audit_logger import audit_logger
            await audit_logger.log_auth_failure(
                db=db,
                email=credentials.email,
                reason="Invalid credentials",
                ip_address=request.client.host
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = auth_response.user
        
        # Get user profile with hospital and role
        profile_response = db.table("profiles").select(
            "id, hospital_id, role, consent_timestamp, hospitals(name)"
        ).eq("id", user.id).eq("deleted_at", None).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found"
            )
        
        profile = profile_response.data
        
        # Update consent timestamp if not already set or if user is re-consenting
        if not profile.get("consent_timestamp"):
            db.table("profiles").update({
                "consent_timestamp": datetime.utcnow().isoformat()
            }).eq("id", user.id).execute()
            logger.info(f"Consent recorded for user: {user.email}")
        
        # Create encrypted session cookie
        session_manager.create_session(
            response=response,
            user_id=str(user.id),
            email=user.email,
            hospital_id=str(profile["hospital_id"]),
            role=profile["role"]
        )
        
        # Log successful login
        from utils.audit_logger import audit_logger
        await audit_logger.log_auth_success(
            db=db,
            user_id=str(user.id),
            hospital_id=str(profile["hospital_id"]),
            email=user.email,
            ip_address=request.client.host
        )
        
        logger.info(f"User logged in: {user.email} (role: {profile['role']})")
        
        return LoginResponse(
            success=True,
            message="Login successful",
            user={
                "id": str(user.id),
                "email": user.email,
                "role": profile["role"],
                "hospital_id": str(profile["hospital_id"]),
                "hospital_name": profile["hospitals"]["name"] if profile.get("hospitals") else None
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """
    Logout user and destroy session
    
    Requires valid session cookie
    """
    try:
        # Destroy session cookie
        session_manager.destroy_session(response)
        
        logger.info(f"User logged out: {current_user['email']}")
        
        return LogoutResponse(
            success=True,
            message="Logout successful"
        )
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout"
        )


@router.get("/me")
async def get_current_user_info(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user information
    
    Requires valid session cookie
    Automatically refreshes session on activity
    """
    # Refresh session activity timestamp
    session_manager.refresh_session(request, response)
    
    return {
        "user": {
            "id": current_user["user_id"],
            "email": current_user["email"],
            "role": current_user["role"],
            "hospital_id": current_user["hospital_id"]
        }
    }


@router.delete("/me")
async def delete_user_account(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Permanently delete user account and all personal data (GDPR Right to be Forgotten)
    
    This endpoint:
    - Permanently deletes user profile
    - Deletes all test attempts
    - Deletes all doubts submitted by the user
    - Anonymizes doubts answered by the user (sets answered_by to NULL)
    - Deletes the auth user account
    - Destroys the session
    
    This action is IRREVERSIBLE.
    
    Requires valid session cookie
    """
    try:
        user_id = current_user["user_id"]
        email = current_user["email"]
        
        logger.info(f"Starting account deletion for user: {email} (ID: {user_id})")
        
        # 1. Delete all test attempts
        test_attempts_response = db.table("test_attempts").delete().eq("profile_id", user_id).execute()
        test_attempts_count = len(test_attempts_response.data) if test_attempts_response.data else 0
        logger.info(f"Deleted {test_attempts_count} test attempts for user {user_id}")
        
        # 2. Delete all doubts submitted by the user (hard delete)
        doubts_response = db.table("doubts").delete().eq("profile_id", user_id).execute()
        doubts_count = len(doubts_response.data) if doubts_response.data else 0
        logger.info(f"Deleted {doubts_count} doubts for user {user_id}")
        
        # 3. Anonymize doubts answered by the user (set answered_by to NULL)
        # This preserves the doubt for the original asker but removes the manager's identity
        answered_doubts_response = db.table("doubts").update({
            "answered_by": None
        }).eq("answered_by", user_id).execute()
        answered_doubts_count = len(answered_doubts_response.data) if answered_doubts_response.data else 0
        logger.info(f"Anonymized {answered_doubts_count} doubts answered by user {user_id}")
        
        # 4. Delete user profile (this will cascade due to ON DELETE CASCADE in foreign keys)
        profile_response = db.table("profiles").delete().eq("id", user_id).execute()
        if not profile_response.data:
            logger.warning(f"Profile not found for user {user_id}, may have been already deleted")
        
        # 5. Delete auth user (this is the final step)
        # Note: Supabase admin API is needed for this, using the service role
        try:
            db.auth.admin.delete_user(user_id)
            logger.info(f"Deleted auth user {user_id}")
        except Exception as auth_error:
            logger.error(f"Failed to delete auth user {user_id}: {str(auth_error)}")
            # Continue anyway - the profile and data are deleted
        
        # 6. Destroy session
        session_manager.destroy_session(response)
        
        # 7. Log the deletion for audit purposes
        from utils.audit_logger import audit_logger
        await audit_logger.log_account_deletion(
            db=db,
            user_id=user_id,
            email=email,
            hospital_id=current_user["hospital_id"],
            test_attempts_deleted=test_attempts_count,
            doubts_deleted=doubts_count,
            doubts_anonymized=answered_doubts_count
        )
        
        logger.info(f"Account deletion completed for user: {email} (ID: {user_id})")
        
        return {
            "success": True,
            "message": "Account and all personal data have been permanently deleted",
            "deleted": {
                "test_attempts": test_attempts_count,
                "doubts": doubts_count,
                "doubts_anonymized": answered_doubts_count
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during account deletion"
        )


@router.get("/me/export", response_model=UserDataExport)
async def export_user_data(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """
    Export all user's personal data for GDPR compliance
    
    Returns comprehensive JSON with:
    - User profile data
    - All test attempts with scores
    - All doubts submitted
    - Video watch history (inferred from test attempts)
    
    Requires valid session cookie
    """
    try:
        user_id = current_user["user_id"]
        
        # 1. Get user profile data
        profile_response = db.table("profiles").select(
            "id, hospital_id, full_name, role, is_focal_point, consent_timestamp, created_at, hospitals(name)"
        ).eq("id", user_id).eq("deleted_at", None).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile_data = profile_response.data
        
        # 2. Get all test attempts with lesson details
        test_attempts_response = db.table("test_attempts").select(
            """
            id, lesson_id, type, score, answers, started_at, completed_at,
            lessons(id, title, track_id, tracks(id, title))
            """
        ).eq("profile_id", user_id).order("completed_at", desc=True).execute()
        
        test_attempts = []
        for attempt in test_attempts_response.data:
            test_attempts.append({
                "id": str(attempt["id"]),
                "lesson_id": str(attempt["lesson_id"]),
                "lesson_title": attempt["lessons"]["title"] if attempt.get("lessons") else None,
                "track_title": attempt["lessons"]["tracks"]["title"] if attempt.get("lessons") and attempt["lessons"].get("tracks") else None,
                "type": attempt["type"],
                "score": float(attempt["score"]),
                "answers": attempt["answers"],
                "started_at": attempt["started_at"],
                "completed_at": attempt["completed_at"]
            })
        
        # 3. Get all doubts submitted by the user
        doubts_response = db.table("doubts").select(
            """
            id, lesson_id, text, image_url, status, answer, answered_by, 
            ai_summary, created_at,
            lessons(id, title)
            """
        ).eq("profile_id", user_id).eq("deleted_at", None).order("created_at", desc=True).execute()
        
        doubts = []
        for doubt in doubts_response.data:
            doubts.append({
                "id": str(doubt["id"]),
                "lesson_id": str(doubt["lesson_id"]),
                "lesson_title": doubt["lessons"]["title"] if doubt.get("lessons") else None,
                "text": doubt["text"],
                "image_url": doubt.get("image_url"),
                "status": doubt["status"],
                "answer": doubt.get("answer"),
                "answered_by": str(doubt["answered_by"]) if doubt.get("answered_by") else None,
                "ai_summary": doubt.get("ai_summary"),
                "created_at": doubt["created_at"]
            })
        
        # 4. Build video watch history from test attempts
        # Users watch videos between pre-test and post-test
        video_history = []
        lessons_watched = {}
        
        for attempt in test_attempts_response.data:
            lesson_id = str(attempt["lesson_id"])
            if lesson_id not in lessons_watched:
                lessons_watched[lesson_id] = {
                    "lesson_id": lesson_id,
                    "lesson_title": attempt["lessons"]["title"] if attempt.get("lessons") else None,
                    "track_title": attempt["lessons"]["tracks"]["title"] if attempt.get("lessons") and attempt["lessons"].get("tracks") else None,
                    "pre_test_completed": None,
                    "post_test_completed": None,
                    "video_watched": False
                }
            
            if attempt["type"] == "pre":
                lessons_watched[lesson_id]["pre_test_completed"] = attempt["completed_at"]
            elif attempt["type"] == "post":
                lessons_watched[lesson_id]["post_test_completed"] = attempt["completed_at"]
                # If post-test is completed, video was watched
                lessons_watched[lesson_id]["video_watched"] = True
        
        # Convert to list
        for lesson_data in lessons_watched.values():
            if lesson_data["video_watched"]:
                video_history.append({
                    "lesson_id": lesson_data["lesson_id"],
                    "lesson_title": lesson_data["lesson_title"],
                    "track_title": lesson_data["track_title"],
                    "pre_test_completed_at": lesson_data["pre_test_completed"],
                    "post_test_completed_at": lesson_data["post_test_completed"],
                    "inferred_watch_date": lesson_data["post_test_completed"]
                })
        
        # Sort video history by watch date
        video_history.sort(key=lambda x: x["inferred_watch_date"] or "", reverse=True)
        
        # 5. Build export response
        export_data = UserDataExport(
            profile={
                "id": str(profile_data["id"]),
                "hospital_id": str(profile_data["hospital_id"]),
                "hospital_name": profile_data["hospitals"]["name"] if profile_data.get("hospitals") else None,
                "full_name": profile_data["full_name"],
                "role": profile_data["role"],
                "is_focal_point": profile_data["is_focal_point"],
                "consent_timestamp": profile_data.get("consent_timestamp"),
                "created_at": profile_data["created_at"]
            },
            test_attempts=test_attempts,
            doubts=doubts,
            video_history=video_history,
            export_date=datetime.utcnow()
        )
        
        logger.info(f"User data exported: {current_user['email']} ({len(test_attempts)} test attempts, {len(doubts)} doubts, {len(video_history)} videos watched)")
        
        return export_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data export error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during data export"
        )
