"""
Alerting system for critical events.
Sends alerts via email, Slack, or other channels.
"""

import os
import logging
import time
from typing import Optional, List
from enum import Enum
import json
import aiohttp

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertChannel(str, Enum):
    """Alert delivery channels."""
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    LOG = "log"


class Alert:
    """Alert message."""
    
    def __init__(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.INFO,
        tags: Optional[dict] = None,
        metadata: Optional[dict] = None,
    ):
        self.title = title
        self.message = message
        self.severity = severity
        self.tags = tags or {}
        self.metadata = metadata or {}
    
    def to_dict(self) -> dict:
        """Convert alert to dictionary."""
        return {
            "title": self.title,
            "message": self.message,
            "severity": self.severity.value,
            "tags": self.tags,
            "metadata": self.metadata,
        }


class AlertManager:
    """Manages alert delivery to various channels."""
    
    def __init__(self):
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        self.alert_email = os.getenv("ALERT_EMAIL")
        self.custom_webhook_url = os.getenv("ALERT_WEBHOOK_URL")
        self.enabled_channels = self._get_enabled_channels()
    
    def _get_enabled_channels(self) -> List[AlertChannel]:
        """Get list of enabled alert channels."""
        channels = [AlertChannel.LOG]  # Always log
        
        if self.slack_webhook_url:
            channels.append(AlertChannel.SLACK)
        
        if self.alert_email:
            channels.append(AlertChannel.EMAIL)
        
        if self.custom_webhook_url:
            channels.append(AlertChannel.WEBHOOK)
        
        return channels
    
    async def send_alert(self, alert: Alert):
        """
        Send alert to all enabled channels.
        
        Args:
            alert: Alert to send
        """
        for channel in self.enabled_channels:
            try:
                if channel == AlertChannel.LOG:
                    await self._send_to_log(alert)
                elif channel == AlertChannel.SLACK:
                    await self._send_to_slack(alert)
                elif channel == AlertChannel.EMAIL:
                    await self._send_to_email(alert)
                elif channel == AlertChannel.WEBHOOK:
                    await self._send_to_webhook(alert)
            except Exception as e:
                logger.error(f"Failed to send alert via {channel}: {e}")
    
    async def _send_to_log(self, alert: Alert):
        """Log the alert."""
        log_level = {
            AlertSeverity.INFO: logging.INFO,
            AlertSeverity.WARNING: logging.WARNING,
            AlertSeverity.ERROR: logging.ERROR,
            AlertSeverity.CRITICAL: logging.CRITICAL,
        }.get(alert.severity, logging.INFO)
        
        logger.log(
            log_level,
            f"ALERT [{alert.severity.value.upper()}] {alert.title}: {alert.message}",
            extra={"tags": alert.tags, "metadata": alert.metadata}
        )
    
    async def _send_to_slack(self, alert: Alert):
        """Send alert to Slack."""
        if not self.slack_webhook_url:
            return
        
        # Map severity to Slack color
        color_map = {
            AlertSeverity.INFO: "#36a64f",  # Green
            AlertSeverity.WARNING: "#ff9900",  # Orange
            AlertSeverity.ERROR: "#ff0000",  # Red
            AlertSeverity.CRITICAL: "#8b0000",  # Dark red
        }
        
        # Build Slack message
        payload = {
            "attachments": [
                {
                    "color": color_map.get(alert.severity, "#36a64f"),
                    "title": f"🚨 {alert.title}",
                    "text": alert.message,
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.severity.value.upper(),
                            "short": True
                        }
                    ],
                    "footer": "SL Academy Platform",
                    "ts": int(time.time())
                }
            ]
        }
        
        # Add tags as fields
        for key, value in alert.tags.items():
            payload["attachments"][0]["fields"].append({
                "title": key.replace("_", " ").title(),
                "value": str(value),
                "short": True
            })
        
        # Send to Slack
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.slack_webhook_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status != 200:
                    logger.error(f"Failed to send Slack alert: {response.status}")
    
    async def _send_to_email(self, alert: Alert):
        """Send alert via email."""
        # Email sending would require SMTP configuration
        # This is a placeholder for email integration
        logger.info(f"Email alert would be sent to {self.alert_email}: {alert.title}")
    
    async def _send_to_webhook(self, alert: Alert):
        """Send alert to custom webhook."""
        if not self.custom_webhook_url:
            return
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.custom_webhook_url,
                json=alert.to_dict(),
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status != 200:
                    logger.error(f"Failed to send webhook alert: {response.status}")


# Global alert manager instance
alert_manager = AlertManager()


# Convenience functions
async def send_info_alert(title: str, message: str, **kwargs):
    """Send an info alert."""
    alert = Alert(title, message, AlertSeverity.INFO, **kwargs)
    await alert_manager.send_alert(alert)


async def send_warning_alert(title: str, message: str, **kwargs):
    """Send a warning alert."""
    alert = Alert(title, message, AlertSeverity.WARNING, **kwargs)
    await alert_manager.send_alert(alert)


async def send_error_alert(title: str, message: str, **kwargs):
    """Send an error alert."""
    alert = Alert(title, message, AlertSeverity.ERROR, **kwargs)
    await alert_manager.send_alert(alert)


async def send_critical_alert(title: str, message: str, **kwargs):
    """Send a critical alert."""
    alert = Alert(title, message, AlertSeverity.CRITICAL, **kwargs)
    await alert_manager.send_alert(alert)


# Alert rules
class AlertRule:
    """Defines conditions for triggering alerts."""
    
    def __init__(
        self,
        name: str,
        condition: callable,
        severity: AlertSeverity,
        message_template: str,
        cooldown_seconds: int = 300,  # 5 minutes
    ):
        self.name = name
        self.condition = condition
        self.severity = severity
        self.message_template = message_template
        self.cooldown_seconds = cooldown_seconds
        self.last_triggered = 0
    
    def should_trigger(self, metrics: dict) -> bool:
        """Check if alert should be triggered."""
        import time
        
        # Check cooldown
        if time.time() - self.last_triggered < self.cooldown_seconds:
            return False
        
        # Check condition
        if self.condition(metrics):
            self.last_triggered = time.time()
            return True
        
        return False
    
    def format_message(self, metrics: dict) -> str:
        """Format alert message with metrics."""
        return self.message_template.format(**metrics)


# Pre-defined alert rules
import time

ALERT_RULES = [
    AlertRule(
        name="high_error_rate",
        condition=lambda m: m.get("error_rate", 0) > 0.05,  # > 5%
        severity=AlertSeverity.ERROR,
        message_template="Error rate is {error_rate:.2%} (threshold: 5%)",
    ),
    AlertRule(
        name="slow_api_response",
        condition=lambda m: m.get("p95_response_time", 0) > 1000,  # > 1s
        severity=AlertSeverity.WARNING,
        message_template="API p95 response time is {p95_response_time:.0f}ms (threshold: 1000ms)",
    ),
    AlertRule(
        name="high_memory_usage",
        condition=lambda m: m.get("memory_usage_percent", 0) > 90,  # > 90%
        severity=AlertSeverity.CRITICAL,
        message_template="Memory usage is {memory_usage_percent:.1f}% (threshold: 90%)",
    ),
    AlertRule(
        name="database_connection_errors",
        condition=lambda m: m.get("db_connection_errors", 0) > 10,
        severity=AlertSeverity.CRITICAL,
        message_template="Database connection errors: {db_connection_errors} (threshold: 10)",
    ),
]


async def check_alert_rules(metrics: dict):
    """
    Check all alert rules and send alerts if triggered.
    
    Args:
        metrics: Dictionary of current metrics
    """
    for rule in ALERT_RULES:
        try:
            if rule.should_trigger(metrics):
                message = rule.format_message(metrics)
                alert = Alert(
                    title=f"Alert: {rule.name.replace('_', ' ').title()}",
                    message=message,
                    severity=rule.severity,
                    tags={"rule": rule.name},
                    metadata=metrics,
                )
                await alert_manager.send_alert(alert)
        except Exception as e:
            logger.error(f"Error checking alert rule {rule.name}: {e}")
