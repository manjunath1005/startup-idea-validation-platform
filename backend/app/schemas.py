from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any, Optional

# Authentication schemas
class OTPRequest(BaseModel):
    email: EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    otp: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# Startup Idea schemas
class StartupIdeaCreate(BaseModel):
    name: str
    industry: str
    problem_statement: str
    solution_description: str
    target_audience: str
    business_type: str
    country_region: str

class StartupIdeaResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    industry: str
    problem_statement: str
    solution_description: str
    target_audience: str
    business_type: str
    country_region: str
    created_at: datetime

    class Config:
        from_attributes = True


# Score & SWOT schemas
class StartupScoreResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    viability_score: int
    market_opportunity_score: int
    competition_score: int
    revenue_potential_score: int
    risk_assessment_score: int
    explanation: str
    improvement_suggestions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SWOTReportResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    recommendations: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Competitors & Revenue schemas
class CompetitorItem(BaseModel):
    name: str
    website: str
    category: str
    market_position: str
    comparison: Dict[str, Any]  # features comparison (e.g. {"Feature A": true, "Feature B": false})

class CompetitorReportResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    competitors: List[CompetitorItem]
    market_gap_analysis: str
    differentiation_suggestions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class PricingSuggestion(BaseModel):
    tier_name: str
    price: str
    frequency: str
    features: List[str]

class RevenueReportResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    recommended_model: str
    pricing_suggestions: List[PricingSuggestion]
    revenue_rationale: str
    created_at: datetime

    class Config:
        from_attributes = True


# Business Canvas & Pitch Deck schemas
class BusinessCanvasResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    value_proposition: str
    customer_segments: str
    revenue_streams: str
    key_activities: str
    key_partners: str
    cost_structure: str
    channels: str
    customer_relationships: str
    key_resources: str
    created_at: datetime

    class Config:
        from_attributes = True

class PitchDeckSlide(BaseModel):
    slide_number: int
    title: str
    bullets: List[str]
    visual_suggestion: str

class PitchDeckResponse(BaseModel):
    id: UUID
    startup_idea_id: UUID
    slides: List[PitchDeckSlide]
    created_at: datetime

    class Config:
        from_attributes = True


# Combined full report schema
class FullReportResponse(BaseModel):
    idea: StartupIdeaResponse
    scores: Optional[StartupScoreResponse] = None
    swot: Optional[SWOTReportResponse] = None
    competitors: Optional[CompetitorReportResponse] = None
    revenue: Optional[RevenueReportResponse] = None
    canvas: Optional[BusinessCanvasResponse] = None
    pitch_deck: Optional[PitchDeckResponse] = None
