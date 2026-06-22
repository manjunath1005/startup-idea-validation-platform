from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from typing import Dict
from app.database import get_db
from app.models import (
    StartupIdea, User, StartupScore, SWOTReport,
    CompetitorReport, RevenueReport, BusinessCanvas, PitchDeck
)
from app.schemas import (
    StartupScoreResponse, SWOTReportResponse, CompetitorReportResponse,
    RevenueReportResponse, BusinessCanvasResponse, PitchDeckResponse
)
from app.auth import get_current_user
from app.services import gemini

router = APIRouter(prefix="/analysis", tags=["AI Startup Analysis Engine"])

# Input request schema for triggering analysis
class AnalysisTriggerRequest(BaseModel):
    startup_idea_id: UUID


def verify_idea_ownership(idea_id: UUID, user_id: UUID, db: Session) -> StartupIdea:
    idea = db.query(StartupIdea).filter(StartupIdea.id == idea_id, StartupIdea.user_id == user_id).first()
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found or access denied."
        )
    return idea


@router.post("/evaluate", response_model=StartupScoreResponse)
def run_evaluation(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    # Fetch previous version if iteration version > 1
    prev_idea = None
    if idea.version > 1:
        prev_idea = db.query(StartupIdea).filter(
            StartupIdea.user_id == current_user.id,
            (StartupIdea.parent_id == (idea.parent_id or idea.id)) | (StartupIdea.id == (idea.parent_id or idea.id)),
            StartupIdea.version == idea.version - 1
        ).first()

    # Run Gemini AI evaluation
    result = gemini.evaluate_startup_idea(idea, prev_idea=prev_idea)
    
    # Store or Update in database
    db_score = db.query(StartupScore).filter(StartupScore.startup_idea_id == idea.id).first()
    if db_score:
        db_score.viability_score = result["viability_score"]
        db_score.market_opportunity_score = result["market_opportunity_score"]
        db_score.competition_score = result["competition_score"]
        db_score.revenue_potential_score = result["revenue_potential_score"]
        db_score.risk_assessment_score = result["risk_assessment_score"]
        db_score.explanation = result["explanation"]
        db_score.improvement_suggestions = result["improvement_suggestions"]
        db_score.key_changes = result.get("key_changes", [])
    else:
        db_score = StartupScore(
            startup_idea_id=idea.id,
            viability_score=result["viability_score"],
            market_opportunity_score=result["market_opportunity_score"],
            competition_score=result["competition_score"],
            revenue_potential_score=result["revenue_potential_score"],
            risk_assessment_score=result["risk_assessment_score"],
            explanation=result["explanation"],
            improvement_suggestions=result["improvement_suggestions"],
            key_changes=result.get("key_changes", [])
        )
        db.add(db_score)
        
    db.commit()
    db.refresh(db_score)
    return db_score


@router.post("/swot", response_model=SWOTReportResponse)
def run_swot(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    result = gemini.generate_swot(idea)
    
    db_swot = db.query(SWOTReport).filter(SWOTReport.startup_idea_id == idea.id).first()
    if db_swot:
        db_swot.strengths = result["strengths"]
        db_swot.weaknesses = result["weaknesses"]
        db_swot.opportunities = result["opportunities"]
        db_swot.threats = result["threats"]
        db_swot.recommendations = result["recommendations"]
    else:
        db_swot = SWOTReport(
            startup_idea_id=idea.id,
            strengths=result["strengths"],
            weaknesses=result["weaknesses"],
            opportunities=result["opportunities"],
            threats=result["threats"],
            recommendations=result["recommendations"]
        )
        db.add(db_swot)
        
    db.commit()
    db.refresh(db_swot)
    return db_swot


@router.post("/competitors", response_model=CompetitorReportResponse)
def run_competitors(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    result = gemini.analyze_competitors(idea)
    
    db_comp = db.query(CompetitorReport).filter(CompetitorReport.startup_idea_id == idea.id).first()
    if db_comp:
        db_comp.competitors = result["competitors"]
        db_comp.market_gap_analysis = result["market_gap_analysis"]
        db_comp.differentiation_suggestions = result["differentiation_suggestions"]
    else:
        db_comp = CompetitorReport(
            startup_idea_id=idea.id,
            competitors=result["competitors"],
            market_gap_analysis=result["market_gap_analysis"],
            differentiation_suggestions=result["differentiation_suggestions"]
        )
        db.add(db_comp)
        
    db.commit()
    db.refresh(db_comp)
    return db_comp


@router.post("/revenue", response_model=RevenueReportResponse)
def run_revenue(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    result = gemini.recommend_revenue_model(idea)
    
    db_rev = db.query(RevenueReport).filter(RevenueReport.startup_idea_id == idea.id).first()
    if db_rev:
        db_rev.recommended_model = result["recommended_model"]
        db_rev.pricing_suggestions = result["pricing_suggestions"]
        db_rev.revenue_rationale = result["revenue_rationale"]
    else:
        db_rev = RevenueReport(
            startup_idea_id=idea.id,
            recommended_model=result["recommended_model"],
            pricing_suggestions=result["pricing_suggestions"],
            revenue_rationale=result["revenue_rationale"]
        )
        db.add(db_rev)
        
    db.commit()
    db.refresh(db_rev)
    return db_rev


@router.post("/canvas", response_model=BusinessCanvasResponse)
def run_canvas(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    result = gemini.generate_canvas(idea)
    
    db_canvas = db.query(BusinessCanvas).filter(BusinessCanvas.startup_idea_id == idea.id).first()
    if db_canvas:
        db_canvas.value_proposition = result["value_proposition"]
        db_canvas.customer_segments = result["customer_segments"]
        db_canvas.revenue_streams = result["revenue_streams"]
        db_canvas.key_activities = result["key_activities"]
        db_canvas.key_partners = result["key_partners"]
        db_canvas.cost_structure = result["cost_structure"]
        db_canvas.channels = result["channels"]
        db_canvas.customer_relationships = result["customer_relationships"]
        db_canvas.key_resources = result["key_resources"]
    else:
        db_canvas = BusinessCanvas(
            startup_idea_id=idea.id,
            value_proposition=result["value_proposition"],
            customer_segments=result["customer_segments"],
            revenue_streams=result["revenue_streams"],
            key_activities=result["key_activities"],
            key_partners=result["key_partners"],
            cost_structure=result["cost_structure"],
            channels=result["channels"],
            customer_relationships=result["customer_relationships"],
            key_resources=result["key_resources"]
        )
        db.add(db_canvas)
        
    db.commit()
    db.refresh(db_canvas)
    return db_canvas


@router.post("/pitchdeck", response_model=PitchDeckResponse)
def run_pitchdeck(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    result = gemini.generate_pitch_deck(idea)
    
    db_deck = db.query(PitchDeck).filter(PitchDeck.startup_idea_id == idea.id).first()
    if db_deck:
        db_deck.slides = result["slides"]
    else:
        db_deck = PitchDeck(
            startup_idea_id=idea.id,
            slides=result["slides"]
        )
        db.add(db_deck)
        
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.post("/all", response_model=Dict[str, str])
def run_all_analyses(
    payload: AnalysisTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint to trigger all analyses sequentially.
    """
    idea = verify_idea_ownership(payload.startup_idea_id, current_user.id, db)
    
    # 1. Evaluate
    # Fetch previous version if iteration version > 1
    prev_idea = None
    if idea.version > 1:
        prev_idea = db.query(StartupIdea).filter(
            StartupIdea.user_id == current_user.id,
            (StartupIdea.parent_id == (idea.parent_id or idea.id)) | (StartupIdea.id == (idea.parent_id or idea.id)),
            StartupIdea.version == idea.version - 1
        ).first()

    res_eval = gemini.evaluate_startup_idea(idea, prev_idea=prev_idea)
    db_score = db.query(StartupScore).filter(StartupScore.startup_idea_id == idea.id).first()
    if db_score:
        db_score.viability_score = res_eval["viability_score"]
        db_score.market_opportunity_score = res_eval["market_opportunity_score"]
        db_score.competition_score = res_eval["competition_score"]
        db_score.revenue_potential_score = res_eval["revenue_potential_score"]
        db_score.risk_assessment_score = res_eval["risk_assessment_score"]
        db_score.explanation = res_eval["explanation"]
        db_score.improvement_suggestions = res_eval["improvement_suggestions"]
        db_score.key_changes = res_eval.get("key_changes", [])
    else:
        db.add(StartupScore(
            startup_idea_id=idea.id,
            viability_score=res_eval["viability_score"],
            market_opportunity_score=res_eval["market_opportunity_score"],
            competition_score=res_eval["competition_score"],
            revenue_potential_score=res_eval["revenue_potential_score"],
            risk_assessment_score=res_eval["risk_assessment_score"],
            explanation=res_eval["explanation"],
            improvement_suggestions=res_eval["improvement_suggestions"],
            key_changes=res_eval.get("key_changes", [])
        ))

    # 2. SWOT
    res_swot = gemini.generate_swot(idea)
    db_swot = db.query(SWOTReport).filter(SWOTReport.startup_idea_id == idea.id).first()
    if db_swot:
        db_swot.strengths = res_swot["strengths"]
        db_swot.weaknesses = res_swot["weaknesses"]
        db_swot.opportunities = res_swot["opportunities"]
        db_swot.threats = res_swot["threats"]
        db_swot.recommendations = res_swot["recommendations"]
    else:
        db.add(SWOTReport(
            startup_idea_id=idea.id,
            strengths=res_swot["strengths"],
            weaknesses=res_swot["weaknesses"],
            opportunities=res_swot["opportunities"],
            threats=res_swot["threats"],
            recommendations=res_swot["recommendations"]
        ))

    # 3. Competitors
    res_comp = gemini.analyze_competitors(idea)
    db_comp = db.query(CompetitorReport).filter(CompetitorReport.startup_idea_id == idea.id).first()
    if db_comp:
        db_comp.competitors = res_comp["competitors"]
        db_comp.market_gap_analysis = res_comp["market_gap_analysis"]
        db_comp.differentiation_suggestions = res_comp["differentiation_suggestions"]
    else:
        db.add(CompetitorReport(
            startup_idea_id=idea.id,
            competitors=res_comp["competitors"],
            market_gap_analysis=res_comp["market_gap_analysis"],
            differentiation_suggestions=res_comp["differentiation_suggestions"]
        ))

    # 4. Revenue
    res_rev = gemini.recommend_revenue_model(idea)
    db_rev = db.query(RevenueReport).filter(RevenueReport.startup_idea_id == idea.id).first()
    if db_rev:
        db_rev.recommended_model = res_rev["recommended_model"]
        db_rev.pricing_suggestions = res_rev["pricing_suggestions"]
        db_rev.revenue_rationale = res_rev["revenue_rationale"]
    else:
        db.add(RevenueReport(
            startup_idea_id=idea.id,
            recommended_model=res_rev["recommended_model"],
            pricing_suggestions=res_rev["pricing_suggestions"],
            revenue_rationale=res_rev["revenue_rationale"]
        ))

    # 5. Canvas
    res_can = gemini.generate_canvas(idea)
    db_canvas = db.query(BusinessCanvas).filter(BusinessCanvas.startup_idea_id == idea.id).first()
    if db_canvas:
        db_canvas.value_proposition = res_can["value_proposition"]
        db_canvas.customer_segments = res_can["customer_segments"]
        db_canvas.revenue_streams = res_can["revenue_streams"]
        db_canvas.key_activities = res_can["key_activities"]
        db_canvas.key_partners = res_can["key_partners"]
        db_canvas.cost_structure = res_can["cost_structure"]
        db_canvas.channels = res_can["channels"]
        db_canvas.customer_relationships = res_can["customer_relationships"]
        db_canvas.key_resources = res_can["key_resources"]
    else:
        db.add(BusinessCanvas(
            startup_idea_id=idea.id,
            value_proposition=res_can["value_proposition"],
            customer_segments=res_can["customer_segments"],
            revenue_streams=res_can["revenue_streams"],
            key_activities=res_can["key_activities"],
            key_partners=res_can["key_partners"],
            cost_structure=res_can["cost_structure"],
            channels=res_can["channels"],
            customer_relationships=res_can["customer_relationships"],
            key_resources=res_can["key_resources"]
        ))

    # 6. Pitch Deck
    res_deck = gemini.generate_pitch_deck(idea)
    db_deck = db.query(PitchDeck).filter(PitchDeck.startup_idea_id == idea.id).first()
    if db_deck:
        db_deck.slides = res_deck["slides"]
    else:
        db.add(PitchDeck(
            startup_idea_id=idea.id,
            slides=res_deck["slides"]
        ))

    db.commit()
    return {"status": "success", "message": "All analyses triggered and updated successfully."}
