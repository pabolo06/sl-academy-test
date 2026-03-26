"""
SL Academy Platform - AI Models
Pydantic models for AI assistant requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class AssistantRequest(BaseModel):
    """Request for AI assistant endpoint"""
    messages: List[ChatMessage] = Field(..., description="Chat history with at least one message")
    context: Optional[str] = Field(default=None, description="Optional context about hospital or domain")

    class Config:
        json_schema_extra = {
            "example": {
                "messages": [
                    {"role": "user", "content": "What are the signs of acute myocardial infarction?"}
                ],
                "context": "General hospital, cardiology track"
            }
        }


class AssistantResponse(BaseModel):
    """Response from AI assistant endpoint"""
    response: str = Field(..., description="Assistant's response")
    role: str = Field(..., description="User's role: doctor or manager")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
