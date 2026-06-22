from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import StartupIdea, User
from app.schemas import StartupIdeaCreate, StartupIdeaResponse
from app.auth import get_current_user

router = APIRouter(prefix="/startup", tags=["Startup Idea Submission"])

@router.post("/submit", response_model=StartupIdeaResponse, status_code=status.HTTP_201_CREATED)
def submit_idea(
    idea_in: StartupIdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    version = 1
    parent_id = idea_in.parent_id
    
    if parent_id:
        # Verify parent exists and belongs to current user
        parent_idea = db.query(StartupIdea).filter(
            StartupIdea.id == parent_id,
            StartupIdea.user_id == current_user.id
        ).first()
        if not parent_idea:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent startup idea not found."
            )
            
        # Resolve true root parent (flattening hierarchy to max 2 levels)
        root_parent_id = parent_idea.parent_id if parent_idea.parent_id else parent_idea.id
        parent_id = root_parent_id
        
        from sqlalchemy import func, or_
        max_version = db.query(func.max(StartupIdea.version)).filter(
            or_(StartupIdea.id == root_parent_id, StartupIdea.parent_id == root_parent_id)
        ).scalar()
        
        version = (max_version or 1) + 1

    db_idea = StartupIdea(
        user_id=current_user.id,
        name=idea_in.name,
        industry=idea_in.industry,
        problem_statement=idea_in.problem_statement,
        solution_description=idea_in.solution_description,
        target_audience=idea_in.target_audience,
        business_type=idea_in.business_type,
        country_region=idea_in.country_region,
        parent_id=parent_id,
        version=version,
        iteration_note=idea_in.iteration_note
    )
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    return db_idea


@router.get("/list", response_model=List[StartupIdeaResponse])
def list_ideas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ideas = db.query(StartupIdea).filter(StartupIdea.user_id == current_user.id).order_by(StartupIdea.created_at.desc()).all()
    return ideas


@router.get("/{idea_id}", response_model=StartupIdeaResponse)
def get_idea(
    idea_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(StartupIdea).filter(StartupIdea.id == idea_id, StartupIdea.user_id == current_user.id).first()
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found."
        )
    return idea


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(
    idea_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    idea = db.query(StartupIdea).filter(StartupIdea.id == idea_id, StartupIdea.user_id == current_user.id).first()
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea not found."
        )
    db.delete(idea)
    db.commit()
    return

