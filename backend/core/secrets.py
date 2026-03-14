"""
Secrets management module for SL Academy Platform.
Supports AWS Secrets Manager with fallback to environment variables.
"""

import os
import json
import logging
from functools import lru_cache
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Environment detection
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
USE_SECRETS_MANAGER = os.getenv('USE_SECRETS_MANAGER', 'false').lower() == 'true'


@lru_cache(maxsize=1)
def get_secrets() -> Dict[str, Any]:
    """
    Retrieve secrets from AWS Secrets Manager or environment variables.
    
    Returns:
        Dictionary of secrets
    
    Raises:
        RuntimeError: If secrets cannot be retrieved
    """
    if USE_SECRETS_MANAGER and ENVIRONMENT in ['staging', 'production']:
        return _get_secrets_from_aws()
    else:
        return _get_secrets_from_env()


def _get_secrets_from_aws() -> Dict[str, Any]:
    """
    Retrieve secrets from AWS Secrets Manager.
    
    Returns:
        Dictionary of secrets
    
    Raises:
        RuntimeError: If secrets cannot be retrieved from AWS
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        secret_name = f"sl-academy/{ENVIRONMENT}/backend"
        region_name = os.getenv('AWS_REGION', 'us-east-1')
        
        logger.info(f"Retrieving secrets from AWS Secrets Manager: {secret_name}")
        
        # Create Secrets Manager client
        client = boto3.client(
            service_name='secretsmanager',
            region_name=region_name
        )
        
        try:
            response = client.get_secret_value(SecretId=secret_name)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Secret not found: {secret_name}")
                raise RuntimeError(f"Secret {secret_name} not found in AWS Secrets Manager")
            elif error_code == 'InvalidRequestException':
                logger.error(f"Invalid request for secret: {secret_name}")
                raise RuntimeError(f"Invalid request for secret {secret_name}")
            elif error_code == 'InvalidParameterException':
                logger.error(f"Invalid parameter for secret: {secret_name}")
                raise RuntimeError(f"Invalid parameter for secret {secret_name}")
            elif error_code == 'DecryptionFailure':
                logger.error(f"Decryption failed for secret: {secret_name}")
                raise RuntimeError(f"Cannot decrypt secret {secret_name}")
            elif error_code == 'InternalServiceError':
                logger.error(f"AWS Secrets Manager internal error")
                raise RuntimeError("AWS Secrets Manager internal error")
            else:
                logger.error(f"Unexpected error retrieving secret: {e}")
                raise RuntimeError(f"Error retrieving secret: {e}")
        
        # Parse secret string
        if 'SecretString' in response:
            secrets = json.loads(response['SecretString'])
            logger.info(f"Successfully retrieved {len(secrets)} secrets from AWS")
            return secrets
        else:
            logger.error("Secret does not contain SecretString")
            raise RuntimeError("Secret does not contain SecretString")
    
    except ImportError:
        logger.warning("boto3 not installed, falling back to environment variables")
        return _get_secrets_from_env()
    except Exception as e:
        logger.error(f"Error retrieving secrets from AWS: {e}")
        logger.warning("Falling back to environment variables")
        return _get_secrets_from_env()


def _get_secrets_from_env() -> Dict[str, Any]:
    """
    Retrieve secrets from environment variables.
    
    Returns:
        Dictionary of secrets
    
    Raises:
        RuntimeError: If required secrets are missing
    """
    logger.info("Retrieving secrets from environment variables")
    
    required_secrets = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_KEY',
        'SESSION_SECRET_KEY',
    ]
    
    optional_secrets = [
        'OPENAI_API_KEY',
        'SENTRY_DSN',
        'SLACK_WEBHOOK_URL',
        'EMAIL_SMTP_HOST',
        'EMAIL_SMTP_PORT',
        'EMAIL_SMTP_USER',
        'EMAIL_SMTP_PASSWORD',
    ]
    
    secrets = {}
    missing_secrets = []
    
    # Check required secrets
    for secret_name in required_secrets:
        value = os.getenv(secret_name)
        if value:
            secrets[secret_name] = value
        else:
            missing_secrets.append(secret_name)
    
    # Check optional secrets
    for secret_name in optional_secrets:
        value = os.getenv(secret_name)
        if value:
            secrets[secret_name] = value
    
    if missing_secrets:
        error_msg = f"Missing required secrets: {', '.join(missing_secrets)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    logger.info(f"Successfully retrieved {len(secrets)} secrets from environment")
    return secrets


def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Get a specific secret by key.
    
    Args:
        key: Secret key name
        default: Default value if secret not found
    
    Returns:
        Secret value or default
    """
    secrets = get_secrets()
    return secrets.get(key, default)


def validate_secrets() -> bool:
    """
    Validate that all required secrets are present and valid.
    
    Returns:
        True if all secrets are valid, False otherwise
    """
    try:
        secrets = get_secrets()
        
        # Validate Supabase URL format
        supabase_url = secrets.get('SUPABASE_URL', '')
        if not supabase_url.startswith('https://'):
            logger.error("SUPABASE_URL must start with https://")
            return False
        
        # Validate session secret length
        session_secret = secrets.get('SESSION_SECRET_KEY', '')
        if len(session_secret) < 32:
            logger.error("SESSION_SECRET_KEY must be at least 32 characters")
            return False
        
        # Validate Supabase keys are not empty
        if not secrets.get('SUPABASE_ANON_KEY'):
            logger.error("SUPABASE_ANON_KEY is empty")
            return False
        
        if not secrets.get('SUPABASE_SERVICE_KEY'):
            logger.error("SUPABASE_SERVICE_KEY is empty")
            return False
        
        logger.info("All secrets validated successfully")
        return True
    
    except Exception as e:
        logger.error(f"Secret validation failed: {e}")
        return False


def clear_secrets_cache():
    """Clear the secrets cache to force reload."""
    get_secrets.cache_clear()
    logger.info("Secrets cache cleared")


# Initialize secrets on module import
try:
    _secrets = get_secrets()
    logger.info(f"Secrets initialized for environment: {ENVIRONMENT}")
except Exception as e:
    logger.error(f"Failed to initialize secrets: {e}")
    raise
