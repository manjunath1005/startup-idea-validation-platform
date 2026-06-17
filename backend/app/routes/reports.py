import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from typing import List, Optional
from datetime import datetime

# Reportlab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from app.database import get_db
from app.models import StartupIdea, User
from app.schemas import FullReportResponse
from app.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


# NumberedCanvas helper for "Page X of Y" page numbering in PDF
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        # Draw header on all pages except the cover page
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#475569"))
            self.drawString(54, 750, "STARTUP VALIDATION & INVESTOR READINESS REPORT")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, letter[0]-54, 742)

        # Draw footer on all pages
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 36, "Confidential - Startup Idea Validation Platform")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_text)


@router.get("", response_model=List[FullReportResponse])
def get_all_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all ideas along with their generated reports for the active user.
    """
    ideas = db.query(StartupIdea).filter(StartupIdea.user_id == current_user.id)\
        .options(
            joinedload(StartupIdea.scores),
            joinedload(StartupIdea.swot),
            joinedload(StartupIdea.competitors),
            joinedload(StartupIdea.revenue),
            joinedload(StartupIdea.canvas),
            joinedload(StartupIdea.pitch_deck)
        ).order_by(StartupIdea.created_at.desc()).all()
    
    reports = []
    for idea in ideas:
        reports.append(FullReportResponse(
            idea=idea,
            scores=idea.scores,
            swot=idea.swot,
            competitors=idea.competitors,
            revenue=idea.revenue,
            canvas=idea.canvas,
            pitch_deck=idea.pitch_deck
        ))
    return reports


@router.get("/{idea_id}", response_model=FullReportResponse)
def get_report_by_id(
    idea_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a single consolidated report by idea ID.
    """
    idea = db.query(StartupIdea).filter(StartupIdea.id == idea_id, StartupIdea.user_id == current_user.id)\
        .options(
            joinedload(StartupIdea.scores),
            joinedload(StartupIdea.swot),
            joinedload(StartupIdea.competitors),
            joinedload(StartupIdea.revenue),
            joinedload(StartupIdea.canvas),
            joinedload(StartupIdea.pitch_deck)
        ).first()
    
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup idea report not found."
        )
    
    return FullReportResponse(
        idea=idea,
        scores=idea.scores,
        swot=idea.swot,
        competitors=idea.competitors,
        revenue=idea.revenue,
        canvas=idea.canvas,
        pitch_deck=idea.pitch_deck
    )


@router.get("/{idea_id}/pdf")
def export_pdf_report(
    idea_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads a beautiful, publication-ready PDF report of validation and investor readiness.
    """
    idea = db.query(StartupIdea).filter(StartupIdea.id == idea_id, StartupIdea.user_id == current_user.id)\
        .options(
            joinedload(StartupIdea.scores),
            joinedload(StartupIdea.swot),
            joinedload(StartupIdea.competitors),
            joinedload(StartupIdea.revenue),
            joinedload(StartupIdea.canvas),
            joinedload(StartupIdea.pitch_deck)
        ).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Startup idea not found.")
    
    buffer = io.BytesIO()
    
    # 0.75-inch margins: 54 points
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom color palette
    primary_color = colors.HexColor("#1E3A8A")  # Royal blue
    secondary_color = colors.HexColor("#0D9488") # Teal
    dark_text = colors.HexColor("#1E293B")
    muted_text = colors.HexColor("#64748B")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=primary_color,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=muted_text,
        spaceAfter=30
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=dark_text,
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    table_header_white = ParagraphStyle(
        'TableHeaderWhite',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.white,
        spaceAfter=0
    )
    
    table_header_dark = ParagraphStyle(
        'TableHeaderDark',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=dark_text,
        spaceAfter=0
    )
    
    story = []
    
    # ------------------ COVER PAGE ------------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("STARTUP IDEA VALIDATION &<br/>INVESTOR READINESS REPORT", title_style))
    story.append(Paragraph(f"Comprehensive evaluation powered by Google Gemini AI Engine", subtitle_style))
    
    story.append(Spacer(1, 15))
    
    # Metadata box
    meta_data = [
        [Paragraph("<b>Startup Name:</b>", body_style), Paragraph(idea.name, body_style)],
        [Paragraph("<b>Industry:</b>", body_style), Paragraph(idea.industry, body_style)],
        [Paragraph("<b>Business Type:</b>", body_style), Paragraph(idea.business_type, body_style)],
        [Paragraph("<b>Geographic Scope:</b>", body_style), Paragraph(idea.country_region, body_style)],
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph(idea.target_audience, body_style)],
        [Paragraph("<b>Report Date:</b>", body_style), Paragraph(datetime.now().strftime("%B %d, %Y"), body_style)],
        [Paragraph("<b>Generated For:</b>", body_style), Paragraph(current_user.full_name or current_user.email, body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[130, 370])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>Concept Summary:</b>", h2_style))
    story.append(Paragraph(f"<b>Problem:</b> {idea.problem_statement}", body_style))
    story.append(Paragraph(f"<b>Solution:</b> {idea.solution_description}", body_style))
    
    story.append(PageBreak())
    
    # ------------------ SECTION 1: VIABILITY SCORES ------------------
    story.append(Paragraph("1. Executive Viability Scores", h1_style))
    if idea.scores:
        score = idea.scores
        score_data = [
            [Paragraph("<b>Metric</b>", table_header_white), Paragraph("<b>Score (0-100)</b>", table_header_white), Paragraph("<b>Verdict</b>", table_header_white)],
            [Paragraph("Startup Viability", body_style), Paragraph(str(score.viability_score), body_style), Paragraph("Strong" if score.viability_score >= 80 else "Moderate" if score.viability_score >= 60 else "Requires Review", body_style)],
            [Paragraph("Market Opportunity", body_style), Paragraph(str(score.market_opportunity_score), body_style), Paragraph("High" if score.market_opportunity_score >= 80 else "Moderate" if score.market_opportunity_score >= 60 else "Niche", body_style)],
            [Paragraph("Competition Friendliness", body_style), Paragraph(str(score.competition_score), body_style), Paragraph("Favorable" if score.competition_score >= 70 else "Intense Competition", body_style)],
            [Paragraph("Revenue Potential", body_style), Paragraph(str(score.revenue_potential_score), body_style), Paragraph("High" if score.revenue_potential_score >= 80 else "Moderate", body_style)],
            [Paragraph("Low-Risk Safety", body_style), Paragraph(str(score.risk_assessment_score), body_style), Paragraph("Low Risk" if score.risk_assessment_score >= 80 else "Moderate Risk" if score.risk_assessment_score >= 50 else "High Risk", body_style)]
        ]
        t_score = Table(score_data, colWidths=[180, 120, 200])
        t_score.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        # The table headers use table_header_white. No more modifying shared body_style.
        story.append(t_score)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("<b>Executive Summary:</b>", h2_style))
        story.append(Paragraph(score.explanation, body_style))
        
        story.append(Spacer(1, 10))
        story.append(Paragraph("<b>Primary Suggestions for Improvement:</b>", h2_style))
        for sug in score.improvement_suggestions:
            story.append(Paragraph(f"&bull; {sug}", bullet_style))
    else:
        story.append(Paragraph("AI Viability Evaluation has not been generated for this startup yet.", body_style))
        
    story.append(Spacer(1, 20))
    
    # ------------------ SECTION 2: SWOT ANALYSIS ------------------
    story.append(Paragraph("2. SWOT Analysis", h1_style))
    if idea.swot:
        sw = idea.swot
        
        # Prepare content blocks
        s_text = "<b>Strengths:</b><br/>" + "<br/>".join([f"&bull; {item}" for item in sw.strengths])
        w_text = "<b>Weaknesses:</b><br/>" + "<br/>".join([f"&bull; {item}" for item in sw.weaknesses])
        o_text = "<b>Opportunities:</b><br/>" + "<br/>".join([f"&bull; {item}" for item in sw.opportunities])
        t_text = "<b>Threats:</b><br/>" + "<br/>".join([f"&bull; {item}" for item in sw.threats])
        
        swot_data = [
            [Paragraph(s_text, body_style), Paragraph(w_text, body_style)],
            [Paragraph(o_text, body_style), Paragraph(t_text, body_style)]
        ]
        t_swot = Table(swot_data, colWidths=[245, 245])
        t_swot.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), colors.HexColor("#ECFDF5")),  # light green
            ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FEF2F2")),  # light red
            ('BACKGROUND', (0,1), (0,1), colors.HexColor("#EFF6FF")),  # light blue
            ('BACKGROUND', (1,1), (1,1), colors.HexColor("#FFFBEB")),  # light yellow
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('GRID', (0,0), (-1,-1), 1, border_color),
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_swot)
        
        story.append(Spacer(1, 15))
        story.append(Paragraph("<b>SWOT Strategic Recommendations:</b>", h2_style))
        for rec in sw.recommendations:
            story.append(Paragraph(f"&bull; {rec}", bullet_style))
    else:
        story.append(Paragraph("SWOT Analysis has not been generated for this startup yet.", body_style))
        
    story.append(PageBreak())
    
    # ------------------ SECTION 3: COMPETITOR INTELLIGENCE ------------------
    story.append(Paragraph("3. Competitor Intelligence & Positioning", h1_style))
    if idea.competitors:
        comp_rep = idea.competitors
        
        # Build competitor comparison table headers dynamically based on features dict
        comps_list = comp_rep.competitors
        if comps_list and len(comps_list) > 0:
            sample_comp = comps_list[0]
            feature_keys = list(sample_comp.get("comparison", {}).keys())
            
            # Header row
            header_row = [Paragraph("<b>Competitor Name</b>", table_header_dark), Paragraph("<b>Category</b>", table_header_dark)]
            for fk in feature_keys:
                header_row.append(Paragraph(f"<b>{fk}</b>", table_header_dark))
                
            comp_table_data = [header_row]
            
            for cmp in comps_list:
                row = [
                    Paragraph(f"<b>{cmp.get('name')}</b><br/><font size=7 color='#64748B'>{cmp.get('website')}</font>", body_style),
                    Paragraph(f"{cmp.get('category')}<br/><font size=7 color='#64748B'>{cmp.get('market_position')}</font>", body_style)
                ]
                comp_features = cmp.get("comparison", {})
                for fk in feature_keys:
                    has_feat = comp_features.get(fk, False)
                    feat_text = "<font color='green'><b>YES</b></font>" if has_feat else "<font color='red'>NO</font>"
                    row.append(Paragraph(feat_text, body_style))
                comp_table_data.append(row)
                
            col_width = 500 / len(header_row)
            t_comp = Table(comp_table_data, colWidths=[col_width] * len(header_row))
            t_comp.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), bg_light),
                ('GRID', (0,0), (-1,-1), 0.5, border_color),
                ('BOX', (0,0), (-1,-1), 1, border_color),
                ('PADDING', (0,0), (-1,-1), 6),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(t_comp)
            story.append(Spacer(1, 15))
            
        story.append(Paragraph("<b>Market Gap Analysis:</b>", h2_style))
        story.append(Paragraph(comp_rep.market_gap_analysis, body_style))
        
        story.append(Spacer(1, 10))
        story.append(Paragraph("<b>Suggested Differentiation Angles:</b>", h2_style))
        for diff in comp_rep.differentiation_suggestions:
            story.append(Paragraph(f"&bull; {diff}", bullet_style))
    else:
        story.append(Paragraph("Competitor Intelligence Report has not been generated yet.", body_style))
        
    story.append(Spacer(1, 20))
    
    # ------------------ SECTION 4: REVENUE MODEL ------------------
    story.append(Paragraph("4. Revenue & Monetization Strategy", h1_style))
    if idea.revenue:
        rev = idea.revenue
        story.append(Paragraph(f"<b>Recommended Model Type:</b> {rev.recommended_model}", body_style))
        story.append(Spacer(1, 10))
        
        pricing_data = [
            [Paragraph("<b>Pricing Tier</b>", table_header_dark), Paragraph("<b>Price / Freq</b>", table_header_dark), Paragraph("<b>Core Features Included</b>", table_header_dark)]
        ]
        for tier in rev.pricing_suggestions:
            feats = ", ".join(tier.get("features", []))
            pricing_data.append([
                Paragraph(f"<b>{tier.get('tier_name')}</b>", body_style),
                Paragraph(f"{tier.get('price')} {tier.get('frequency')}", body_style),
                Paragraph(feats, body_style)
            ])
            
        t_price = Table(pricing_data, colWidths=[120, 120, 260])
        t_price.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), bg_light),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_price)
        
        story.append(Spacer(1, 15))
        story.append(Paragraph("<b>Strategic Rationale:</b>", h2_style))
        story.append(Paragraph(rev.revenue_rationale, body_style))
    else:
        story.append(Paragraph("Revenue Strategy recommendation has not been generated yet.", body_style))
        
    story.append(PageBreak())
    
    # ------------------ SECTION 5: BUSINESS MODEL CANVAS ------------------
    story.append(Paragraph("5. Business Model Canvas", h1_style))
    if idea.canvas:
        c = idea.canvas
        
        # We will format this in standard paragraphs representing the 9 building blocks.
        canvas_blocks = [
            ("Value Proposition", c.value_proposition),
            ("Customer Segments", c.customer_segments),
            ("Channels", c.channels),
            ("Customer Relationships", c.customer_relationships),
            ("Revenue Streams", c.revenue_streams),
            ("Key Activities", c.key_activities),
            ("Key Resources", c.key_resources),
            ("Key Partners", c.key_partners),
            ("Cost Structure", c.cost_structure)
        ]
        
        for block_name, block_text in canvas_blocks:
            story.append(Paragraph(f"<b>{block_name}:</b>", h2_style))
            story.append(Paragraph(block_text, body_style))
            story.append(Spacer(1, 5))
    else:
        story.append(Paragraph("Business Model Canvas has not been generated yet.", body_style))
        
    story.append(PageBreak())
    
    # ------------------ SECTION 6: PITCH DECK ------------------
    story.append(Paragraph("6. Investor Pitch Deck (Investor Readiness)", h1_style))
    if idea.pitch_deck:
        deck = idea.pitch_deck
        for slide in deck.slides:
            slide_num = slide.get("slide_number", 0)
            title = slide.get("title", "")
            bullets = slide.get("bullets", [])
            visual = slide.get("visual_suggestion", "")
            
            slide_content = []
            slide_content.append(Paragraph(f"<b>Slide {slide_num}: {title}</b>", h2_style))
            for b in bullets:
                slide_content.append(Paragraph(f"&bull; {b}", bullet_style))
            slide_content.append(Paragraph(f"<i>Visual Cue: {visual}</i>", ParagraphStyle('ItalicText', parent=body_style, fontName='Helvetica-Oblique', textColor=muted_text)))
            
            story.append(KeepTogether(slide_content))
            story.append(Spacer(1, 15))
    else:
        story.append(Paragraph("Investor Pitch Deck has not been generated yet.", body_style))
        
    # Build Document using NumberedCanvas helper
    doc.build(story, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    
    # Format startup name to be safe for filenames
    safe_name = "".join([c if c.isalnum() else "_" for c in idea.name])
    filename = f"Startup_Validation_Report_{safe_name}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
