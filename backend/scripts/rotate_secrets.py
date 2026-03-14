#!/usr/bin/env python3
"""
Secret rotation script for SL Academy Platform.
Automates rotation of critical secrets in AWS Secrets Manager.
"""

import os
import sys
import json
import secrets as py_secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
SECRET_NAME = f"sl-academy/{ENVIRONMENT}/backend"
DRY_RUN = os.getenv('DRY_RUN', 'false').lower() == 'true'


def generate_session_secret() -> str:
    """
    Generate a new session secret key.
    
    Returns:
        32-character URL-safe secret
    """
    return py_secrets.token_urlsafe(32)


def get_current_secrets() -> Dict[str, Any]:
    """
    Retrieve current secrets from AWS Secrets Manager.
    
    Returns:
        Dictionary of current secrets
    
    Raises:
        RuntimeError: If secrets cannot be retrieved
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        logger.info(f"Retrieving current secrets: {SECRET_NAME}")
        
        client = boto3.client('secretsmanager', region_name=AWS_REGION)
        
        response = client.get_secret_value(SecretId=SECRET_NAME)
        
        if 'SecretString' in response:
            secrets = json.loads(response['SecretString'])
            logger.info(f"Retrieved {len(secrets)} secrets")
            return secrets
        else:
            raise RuntimeError("Secret does not contain SecretString")
    
    except ImportError:
        logger.error("boto3 not installed. Install with: pip install boto3")
        sys.exit(1)
    except ClientError as e:
        logger.error(f"AWS error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error retrieving secrets: {e}")
        sys.exit(1)


def update_secrets(secrets: Dict[str, Any]) -> bool:
    """
    Update secrets in AWS Secrets Manager.
    
    Args:
        secrets: Dictionary of secrets to update
    
    Returns:
        True if successful, False otherwise
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        if DRY_RUN:
            logger.info("DRY RUN: Would update secrets with:")
            logger.info(json.dumps({k: "***" for k in secrets.keys()}, indent=2))
            return True
        
        logger.info(f"Updating secrets: {SECRET_NAME}")
        
        client = boto3.client('secretsmanager', region_name=AWS_REGION)
        
        client.update_secret(
            SecretId=SECRET_NAME,
            SecretString=json.dumps(secrets)
        )
        
        logger.info("Secrets updated successfully")
        
        # Tag with rotation date
        client.tag_resource(
            SecretId=SECRET_NAME,
            Tags=[
                {'Key': 'LastRotated', 'Value': datetime.now().isoformat()},
                {'Key': 'NextRotation', 'Value': (datetime.now() + timedelta(days=90)).isoformat()},
                {'Key': 'RotatedBy', 'Value': 'automated-script'}
            ]
        )
        
        logger.info("Rotation tags updated")
        return True
    
    except ClientError as e:
        logger.error(f"AWS error: {e}")
        return False
    except Exception as e:
        logger.error(f"Error updating secrets: {e}")
        return False


def rotate_session_secret() -> bool:
    """
    Rotate the session secret key.
    
    Returns:
        True if successful, False otherwise
    """
    logger.info("=" * 60)
    logger.info("Rotating Session Secret")
    logger.info("=" * 60)
    
    # Get current secrets
    current_secrets = get_current_secrets()
    
    # Generate new session secret
    new_secret = generate_session_secret()
    logger.info(f"Generated new session secret (length: {len(new_secret)})")
    
    # Update secrets
    current_secrets['SESSION_SECRET_KEY'] = new_secret
    
    success = update_secrets(current_secrets)
    
    if success:
        logger.info("✅ Session secret rotated successfully")
        logger.info("⚠️  IMPORTANT: Restart application to load new secret")
        logger.info("⚠️  IMPORTANT: Existing sessions will be invalidated")
        return True
    else:
        logger.error("❌ Session secret rotation failed")
        return False


def rotate_all_secrets() -> bool:
    """
    Rotate all rotatable secrets.
    
    Returns:
        True if all rotations successful, False otherwise
    """
    logger.info("=" * 60)
    logger.info("Rotating All Secrets")
    logger.info("=" * 60)
    
    success = True
    
    # Rotate session secret
    if not rotate_session_secret():
        success = False
    
    # Add more secret rotations here as needed
    # Example:
    # if not rotate_api_key():
    #     success = False
    
    return success


def check_rotation_needed() -> bool:
    """
    Check if secrets need rotation based on last rotation date.
    
    Returns:
        True if rotation needed, False otherwise
    """
    try:
        import boto3
        
        logger.info("Checking if rotation is needed")
        
        client = boto3.client('secretsmanager', region_name=AWS_REGION)
        
        response = client.describe_secret(SecretId=SECRET_NAME)
        
        # Check tags for last rotation date
        tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}
        
        if 'LastRotated' in tags:
            last_rotated = datetime.fromisoformat(tags['LastRotated'])
            days_since_rotation = (datetime.now() - last_rotated).days
            
            logger.info(f"Last rotated: {last_rotated.strftime('%Y-%m-%d')} ({days_since_rotation} days ago)")
            
            if days_since_rotation >= 90:
                logger.info("✅ Rotation needed (>= 90 days)")
                return True
            else:
                logger.info(f"❌ Rotation not needed yet ({90 - days_since_rotation} days remaining)")
                return False
        else:
            logger.info("✅ No rotation history found, rotation recommended")
            return True
    
    except Exception as e:
        logger.warning(f"Could not check rotation date: {e}")
        logger.info("✅ Proceeding with rotation")
        return True


def verify_rotation() -> bool:
    """
    Verify that rotation was successful.
    
    Returns:
        True if verification successful, False otherwise
    """
    logger.info("Verifying rotation...")
    
    try:
        # Get updated secrets
        secrets = get_current_secrets()
        
        # Verify session secret length
        session_secret = secrets.get('SESSION_SECRET_KEY', '')
        if len(session_secret) < 32:
            logger.error("Session secret is too short")
            return False
        
        # Verify all required secrets are present
        required_keys = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_KEY',
            'SESSION_SECRET_KEY'
        ]
        
        for key in required_keys:
            if key not in secrets or not secrets[key]:
                logger.error(f"Required secret missing: {key}")
                return False
        
        logger.info("✅ Rotation verification passed")
        return True
    
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return False


def main():
    """Main rotation execution."""
    logger.info("=" * 60)
    logger.info("SL Academy Platform - Secret Rotation")
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Region: {AWS_REGION}")
    logger.info(f"Dry Run: {DRY_RUN}")
    logger.info("=" * 60)
    
    # Check if rotation is needed
    if not check_rotation_needed():
        logger.info("Rotation not needed at this time")
        sys.exit(0)
    
    # Confirm rotation (unless dry run)
    if not DRY_RUN:
        print("\n⚠️  WARNING: This will rotate secrets and invalidate existing sessions")
        print("⚠️  Make sure to restart the application after rotation")
        response = input("\nProceed with rotation? (yes/no): ")
        
        if response.lower() != 'yes':
            logger.info("Rotation cancelled by user")
            sys.exit(0)
    
    # Perform rotation
    success = rotate_all_secrets()
    
    if not success:
        logger.error("Rotation failed")
        sys.exit(1)
    
    # Verify rotation
    if not DRY_RUN:
        if not verify_rotation():
            logger.error("Rotation verification failed")
            sys.exit(1)
    
    logger.info("=" * 60)
    logger.info("Rotation completed successfully")
    logger.info("=" * 60)
    
    if not DRY_RUN:
        logger.info("\n📋 Next Steps:")
        logger.info("1. Restart backend application")
        logger.info("2. Verify application starts successfully")
        logger.info("3. Test authentication flow")
        logger.info("4. Monitor for errors")
    
    sys.exit(0)


if __name__ == '__main__':
    main()
