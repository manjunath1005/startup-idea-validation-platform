import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ideas = relationship("StartupIdea", back_populates="user", cascade="all, delete-orphan")


class StartupIdea(Base):
    __tablename__ = "startup_ideas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=False)
    solution_description = Column(Text, nullable=False)
    target_audience = Column(Text, nullable=False)
    business_type = Column(String, nullable=False)  # B2B, B2C, B2B2C, SaaS, etc.
    country_region = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="ideas")
    scores = relationship("StartupScore", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")
    swot = relationship("SWOTReport", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")
    competitors = relationship("CompetitorReport", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")
    revenue = relationship("RevenueReport", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")
    canvas = relationship("BusinessCanvas", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")
    pitch_deck = relationship("PitchDeck", back_populates="startup_idea", uselist=False, cascade="all, delete-orphan")


class StartupScore(Base):
    __tablename__ = "startup_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    viability_score = Column(Integer, nullable=False)
    market_opportunity_score = Column(Integer, nullable=False)
    competition_score = Column(Integer, nullable=False)
    revenue_potential_score = Column(Integer, nullable=False)
    risk_assessment_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    improvement_suggestions = Column(JSON, nullable=False)  # List of improvement suggestions
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="scores")


class SWOTReport(Base):
    __tablename__ = "swot_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    strengths = Column(JSON, nullable=False)  # List of strengths
    weaknesses = Column(JSON, nullable=False)  # List of weaknesses
    opportunities = Column(JSON, nullable=False)  # List of opportunities
    threats = Column(JSON, nullable=False)  # List of threats
    recommendations = Column(JSON, nullable=False)  # List of recommendations
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="swot")


class CompetitorReport(Base):
    __tablename__ = "competitor_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    competitors = Column(JSON, nullable=False)  # List of direct & indirect competitor objects
    market_gap_analysis = Column(Text, nullable=False)
    differentiation_suggestions = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="competitors")


class RevenueReport(Base):
    __tablename__ = "revenue_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    recommended_model = Column(String, nullable=False)
    pricing_suggestions = Column(JSON, nullable=False)
    revenue_rationale = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="revenue")


class BusinessCanvas(Base):
    __tablename__ = "business_canvas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    value_proposition = Column(Text, nullable=False)
    customer_segments = Column(Text, nullable=False)
    revenue_streams = Column(Text, nullable=False)
    key_activities = Column(Text, nullable=False)
    key_partners = Column(Text, nullable=False)
    cost_structure = Column(Text, nullable=False)
    channels = Column(Text, nullable=False)
    customer_relationships = Column(Text, nullable=False)
    key_resources = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="canvas")


class PitchDeck(Base):
    __tablename__ = "pitch_decks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    startup_idea_id = Column(UUID(as_uuid=True), ForeignKey("startup_ideas.id", ondelete="CASCADE"), nullable=False, unique=True)
    slides = Column(JSON, nullable=False)  # List of slide objects (10 slides)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    startup_idea = relationship("StartupIdea", back_populates="pitch_deck")


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, index=True, nullable=False)
    otp = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

