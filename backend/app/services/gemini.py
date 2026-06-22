import os
import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai

from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini SDK if API Key is configured
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("GEMINI_API_KEY not found in settings. AI services will use mock fallback generators.")


def _call_gemini_json(prompt: str, system_instruction: str = "") -> Dict[str, Any]:
    """
    Helper to invoke Gemini API with a system instruction and return parsed JSON.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API key is not set.")

    try:
        model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=system_instruction
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        text = response.text.strip()
        
        # Clean markdown code block wraps if they exist
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        
        return json.loads(text.strip())
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        # Re-raise to let route handler know or handle appropriately
        raise e


# Helper to format startup details
def _format_startup_info(idea: Any) -> str:
    return f"""
Startup Name: {idea.name}
Industry: {idea.industry}
Business Type: {idea.business_type}
Target Audience: {idea.target_audience}
Target Region/Country: {idea.country_region}
Problem Statement: {idea.problem_statement}
Solution Description: {idea.solution_description}
"""


def evaluate_startup_idea(idea: Any, prev_idea: Any = None) -> Dict[str, Any]:
    """
    Evaluates startup viability, market opportunity, competition level,
    revenue potential, and risk assessment (scores from 0-100).
    Also identifies key changes when comparing against previous versions.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are an expert venture capitalist and startup evaluator. Return a structured JSON response."
    
    comparison_info = ""
    if prev_idea:
        comparison_info = f"""
---
PREVIOUS VERSION (Version {prev_idea.version}) DETAILS:
Startup Name: {prev_idea.name}
Industry: {prev_idea.industry}
Business Type: {prev_idea.business_type}
Target Audience: {prev_idea.target_audience}
Target Region/Country: {prev_idea.country_region}
Problem Statement: {prev_idea.problem_statement}
Solution Description: {prev_idea.solution_description}
"""

    note_info = ""
    if getattr(idea, "iteration_note", None):
        note_info = f"\nFOUNDER'S ITERATION NOTE / REASON FOR CHANGE:\n{idea.iteration_note}\n"

    prompt = f"""
Analyze the following startup idea and evaluate its potential.

{startup_info}
{comparison_info}
{note_info}

You must return a JSON object with the following exact keys and types:
{{
    "viability_score": int (0 to 100),
    "market_opportunity_score": int (0 to 100),
    "competition_score": int (0 to 100 - where 100 means favorable competitive environment, e.g., low competition or highly differentiated),
    "revenue_potential_score": int (0 to 100),
    "risk_assessment_score": int (0 to 100 - where 100 means low risk),
    "explanation": string (detailed evaluation analysis summary),
    "improvement_suggestions": list of strings (actionable suggestions to improve the scores),
    "key_changes": list of strings (actionable summary of key changes, what improved, and what became worse compared to the previous version. If there is no previous version, return an empty list [])
}}
"""
    if not settings.GEMINI_API_KEY:
        # Return mock data
        mock_key_changes = []
        if prev_idea:
            mock_key_changes = [
                f"Narrowed target audience from '{prev_idea.target_audience}' to '{idea.target_audience}'" if prev_idea.target_audience != idea.target_audience else "Refined target audience positioning",
                f"Changed model from '{prev_idea.business_type}' to '{idea.business_type}'" if prev_idea.business_type != idea.business_type else "Maintained business model consistency",
                "Strengthened AI recommendation and pricing intelligence positioning based on founder's iteration note" if getattr(idea, "iteration_note", None) else "Improved core product positioning and value proposition"
            ]
        return {
            "viability_score": 75 if prev_idea else 72,
            "market_opportunity_score": 78 if prev_idea else 75,
            "competition_score": 65 if prev_idea else 55,
            "revenue_potential_score": 74 if prev_idea else 70,
            "risk_assessment_score": 70 if prev_idea else 65,
            "explanation": f"The updated iteration of '{idea.name}' addresses a real problem in the {idea.industry} sector. The target audience of '{idea.target_audience}' shows clear demand, but execution and direct competition are key hurdles. Modernizing operations here offers strong scalability.",
            "improvement_suggestions": [
                "Establish early partnerships with core industry stakeholders.",
                "Build a lightweight MVP focusing on the single most painful problem point.",
                "Refine the differentiation strategy against existing key competitors."
            ],
            "key_changes": mock_key_changes
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        # Fallback if API fails
        logger.warning("Gemini API call failed, using mock fallback.")
        mock_key_changes = []
        if prev_idea:
            mock_key_changes = [
                "Adjusted target customer alignment",
                "Refined pricing model parameters",
                "Increased AI-driven efficiency focus"
            ]
        return {
            "viability_score": 75 if prev_idea else 72,
            "market_opportunity_score": 75,
            "competition_score": 55,
            "revenue_potential_score": 70,
            "risk_assessment_score": 65,
            "explanation": "Temporary API error, using standard fallback analysis. The business model shows positive initial market fit with moderate barrier to entry.",
            "improvement_suggestions": ["Perform secondary focus group tests", "Analyze pricing sensitivity"],
            "key_changes": mock_key_changes
        }


def generate_swot(idea: Any) -> Dict[str, Any]:
    """
    Generates Strengths, Weaknesses, Opportunities, and Threats for the startup.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are an expert startup strategist. Perform a detailed SWOT analysis. Return a structured JSON response."
    
    prompt = f"""
Perform a SWOT analysis for this startup idea:

{startup_info}

You must return a JSON object with the following exact keys and types:
{{
    "strengths": list of strings,
    "weaknesses": list of strings,
    "opportunities": list of strings,
    "threats": list of strings,
    "recommendations": list of strings
}}
"""
    if not settings.GEMINI_API_KEY:
        return {
            "strengths": [
                "Clear value proposition targeting an underserved niche.",
                "Leverages current technological advancements to reduce operating costs.",
                "High initial margin potential through digitized distribution."
            ],
            "weaknesses": [
                "High initial customer acquisition costs (CAC).",
                "Reliance on third-party API integrations or data services.",
                "Lack of established brand presence in a trust-heavy industry."
            ],
            "opportunities": [
                "Expansion into adjacent vertical markets after establishing the core product.",
                "Unmet needs in neighboring regions with similar demographics.",
                "Integration of custom ML models to automate validation checks."
            ],
            "threats": [
                "Fast-following solutions by well-funded incumbents.",
                "Tightening data compliance and local industry regulations.",
                "High customer churn if onboarding friction is not resolved."
            ],
            "recommendations": [
                "Focus on building proprietary features that create data moats.",
                "Launch organic content marketing to lower user acquisition costs.",
                "Form strategic alliances with local community platforms."
            ]
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        logger.warning("Gemini API call failed, using mock SWOT fallback.")
        return {
            "strengths": ["Strong core team capabilities", "Fast setup speed"],
            "weaknesses": ["Limited initial capital", "Undifferentiated marketing"],
            "opportunities": ["Growth in digital adoption"],
            "threats": ["Market saturation"],
            "recommendations": ["Optimize operations"]
        }


def analyze_competitors(idea: Any) -> Dict[str, Any]:
    """
    Identifies direct/indirect competitors, features comparison, gap analysis, and differentiation.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are a competitive intelligence analyst. Perform a competitor analysis. Return a structured JSON response."
    
    prompt = f"""
Analyze competitors for this startup idea:

{startup_info}

You must return a JSON object with the following exact keys and types:
{{
    "competitors": list of objects where each object contains:
        {{
            "name": string (competitor name),
            "website": string (example URL or real URL),
            "category": string (e.g., "Direct Competitor" or "Indirect Competitor"),
            "market_position": string (e.g., "Market Leader", "Niche Player", "Fast-Growing Challenger"),
            "comparison": object (a dict representing features, where key is feature name and value is boolean, e.g., {{"Mobile App": true, "Custom Reports": false}})
        }},
    "market_gap_analysis": string (detailed text of gaps identified in the current market),
    "differentiation_suggestions": list of strings (actionable differentiation strategies)
}}

Make sure the features inside the comparison dict are identical across all competitor objects (list 3-4 features).
"""
    if not settings.GEMINI_API_KEY:
        features = ["Mobile Experience", "Automation Support", "Advanced Customization", "Affordable Tier"]
        return {
            "competitors": [
                {
                    "name": "Incumbent Corp",
                    "website": "www.incumbentcorp.com",
                    "category": "Direct Competitor",
                    "market_position": "Market Leader",
                    "comparison": {
                        "Mobile Experience": True,
                        "Automation Support": False,
                        "Advanced Customization": True,
                        "Affordable Tier": False
                    }
                },
                {
                    "name": "FastStart LLC",
                    "website": "www.faststart.io",
                    "category": "Direct Competitor",
                    "market_position": "Fast-Growing Challenger",
                    "comparison": {
                        "Mobile Experience": False,
                        "Automation Support": True,
                        "Advanced Customization": False,
                        "Affordable Tier": True
                    }
                },
                {
                    "name": "Generic manual workarounds",
                    "website": "N/A",
                    "category": "Indirect Competitor",
                    "market_position": "Legacy Habit",
                    "comparison": {
                        "Mobile Experience": False,
                        "Automation Support": False,
                        "Advanced Customization": True,
                        "Affordable Tier": True
                    }
                }
            ],
            "market_gap_analysis": "Most competitors focus either on enterprise custom systems (which are expensive and slow to deploy) or simple self-serve tools that lack any automated intelligence. There is a huge market gap for an automated, affordable mid-market solution.",
            "differentiation_suggestions": [
                "Incorporate a proprietary automated recommendation engine.",
                "Offer a highly intuitive user interface that reduces setup time to under 10 minutes.",
                "Implement transparent usage-based pricing rather than fixed annual contracts."
            ]
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        logger.warning("Gemini API call failed, using mock Competitor fallback.")
        return {
            "competitors": [
                {
                    "name": "Generic Competitor A",
                    "website": "www.competitora.com",
                    "category": "Direct Competitor",
                    "market_position": "Market Leader",
                    "comparison": {"Feature A": True, "Feature B": False}
                }
            ],
            "market_gap_analysis": "No automated solution exists for this niche.",
            "differentiation_suggestions": ["Develop proprietary data ingestion pipeline"]
        }


def recommend_revenue_model(idea: Any) -> Dict[str, Any]:
    """
    Suggests business model types, tier pricing, and revenue rationale.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are a startup pricing and business model strategist. Return a structured JSON response."
    
    prompt = f"""
Recommend a revenue model and pricing structure for this startup:

{startup_info}

You must return a JSON object with the following exact keys and types:
{{
    "recommended_model": string (e.g., "SaaS", "Subscription", "Freemium", "Marketplace", "Licensing"),
    "pricing_suggestions": list of objects where each object represents a tier:
        {{
            "tier_name": string (e.g., "Starter", "Pro", "Enterprise"),
            "price": string (e.g., "$29", "$99", "Custom"),
            "frequency": string (e.g., "per month", "per year", "one-time"),
            "features": list of strings (what is included)
        }},
    "revenue_rationale": string (reasoning behind the model and pricing structures)
}}
"""
    if not settings.GEMINI_API_KEY:
        return {
            "recommended_model": "SaaS / Subscription",
            "pricing_suggestions": [
                {
                    "tier_name": "Starter",
                    "price": "$19",
                    "frequency": "per month",
                    "features": ["Basic analytics dashboard", "1 active project validation", "Standard reports export"]
                },
                {
                    "tier_name": "Growth Pro",
                    "price": "$49",
                    "frequency": "per month",
                    "features": ["Full AI validation suite", "Unlimited active projects", "Interactive competitor grid", "Priority customer support"]
                },
                {
                    "tier_name": "Enterprise Custom",
                    "price": "Custom",
                    "frequency": "billed annually",
                    "features": ["White-label reports", "API endpoints access", "Dedicated account manager", "Custom SWOT parameter sets"]
                }
            ],
            "revenue_rationale": f"For '{idea.name}' targeting {idea.target_audience}, a monthly subscription model is ideal. It aligns costs with continuous software improvements and analytics updates, while offering a low entry barrier for early adopters with the Starter tier."
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        logger.warning("Gemini API call failed, using mock Revenue fallback.")
        return {
            "recommended_model": "Subscription",
            "pricing_suggestions": [
                {
                    "tier_name": "Standard",
                    "price": "$29",
                    "frequency": "month",
                    "features": ["Core features"]
                }
            ],
            "revenue_rationale": "High repeat usage suggests recurring billing is optimal."
        }


def generate_canvas(idea: Any) -> Dict[str, Any]:
    """
    Generates a Business Model Canvas.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are a business operations architect. Generate a complete Business Model Canvas. Return a structured JSON response."
    
    prompt = f"""
Generate a complete Business Model Canvas for:

{startup_info}

You must return a JSON object with the following exact keys (all string descriptions):
{{
    "value_proposition": string,
    "customer_segments": string,
    "revenue_streams": string,
    "key_activities": string,
    "key_partners": string,
    "cost_structure": string,
    "channels": string,
    "customer_relationships": string,
    "key_resources": string
}}
"""
    if not settings.GEMINI_API_KEY:
        return {
            "value_proposition": f"An intuitive and automated platform that simplifies operations in the {idea.industry} industry, saving founders time and money.",
            "customer_segments": f"Early-stage founders, startup mentors, product managers, and small business operators in '{idea.country_region}'.",
            "revenue_streams": "SaaS monthly subscription, add-on premium reports, custom enterprise setups.",
            "key_activities": "Software development, AI prompt engineering, customer support, and digital marketing campaigns.",
            "key_partners": "Cloud providers, AI technology providers (Google Gemini), local incubator and accelerator programs.",
            "cost_structure": "Cloud server hosting fees, AI API billing, developer salaries, and performance-based marketing expenses.",
            "channels": "Search engine optimization (SEO), product directories (Product Hunt), digital developer newsletters.",
            "customer_relationships": "Self-serve onboarding, automated customer support bots, and an interactive builder community.",
            "key_resources": "Proprietary code base, analytical assessment algorithms, user interaction metrics database."
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        logger.warning("Gemini API call failed, using mock Canvas fallback.")
        return {
            "value_proposition": "Automated workflow management.",
            "customer_segments": "Small businesses",
            "revenue_streams": "Monthly subscriptions",
            "key_activities": "Software engineering",
            "key_partners": "AI providers",
            "cost_structure": "Hosting and developer time",
            "channels": "Direct sales, web",
            "customer_relationships": "Online self-service",
            "key_resources": "Algorithms, engineering staff"
        }


def generate_pitch_deck(idea: Any) -> Dict[str, Any]:
    """
    Generates structured content for a 10-slide investor-ready pitch deck.
    """
    startup_info = _format_startup_info(idea)
    system_instruction = "You are an expert pitch deck designer and presentation coach. Return a structured JSON response."
    
    prompt = f"""
Generate an investor-ready 10-slide pitch deck configuration for this startup:

{startup_info}

You must return a JSON object with the following exact keys:
{{
    "slides": list of objects where each object represents a slide:
        {{
            "slide_number": int (1 to 10),
            "title": string,
            "bullets": list of strings (3-4 concise bullet points),
            "visual_suggestion": string (description of layout, charts, or images to put on the slide)
        }}
}}

Provide slides for the following topics in order:
1. Title / Problem Statement
2. Solution Overview
3. Market Opportunity & Size
4. Business Model
5. Competitor Analysis & Positioning
6. Go-To-Market Strategy
7. Financial Projections
8. Team Overview
9. Funding Ask / Use of Funds
10. Conclusion / Next Steps
"""
    if not settings.GEMINI_API_KEY:
        return {
            "slides": [
                {
                    "slide_number": 1,
                    "title": f"The Problem: Inefficiencies in {idea.industry}",
                    "bullets": [
                        "Founders spend thousands of hours trying to manual-validate concepts.",
                        "No affordable, data-backed automation platforms exist.",
                        "Existing solutions target large enterprises, not early stage."
                    ],
                    "visual_suggestion": "Split layout: Left has statistics on startup failure rates, Right has a large pain-point quote."
                },
                {
                    "slide_number": 2,
                    "title": f"The Solution: {idea.name}",
                    "bullets": [
                        "Automated analysis pipelines powered by generative AI models.",
                        "Actionable dashboards generated in less than 5 minutes.",
                        "Integrated SWOT, competitive, and business canvas builders."
                    ],
                    "visual_suggestion": "Stunning product mockup displaying a high-level analytics dashboard."
                },
                {
                    "slide_number": 3,
                    "title": "Market Opportunity",
                    "bullets": [
                        f"TAM: $10B global market for {idea.industry} tooling.",
                        f"SAM: $500M addressable market in '{idea.country_region}'.",
                        "CAGR of 15% year-over-year growth in tech adoption."
                    ],
                    "visual_suggestion": "Concentric circles chart representing TAM, SAM, and SOM."
                },
                {
                    "slide_number": 4,
                    "title": "Business Model",
                    "bullets": [
                        "Freemium tier to hook early product validation builders.",
                        "$49/mo premium subscription for full reports export.",
                        "Enterprise license for incubators and university programs."
                    ],
                    "visual_suggestion": "Table comparison showing Starter, Growth Pro, and Enterprise pricing columns."
                },
                {
                    "slide_number": 5,
                    "title": "Competitor Analysis",
                    "bullets": [
                        "Incumbents are expensive, manual consulting agencies.",
                        "Self-serve tools lack AI automated insights.",
                        "Our platform bridges the gap with fast, affordable AI reports."
                    ],
                    "visual_suggestion": "Competitor positioning matrix showing our platform in the high-value/affordable quadrant."
                },
                {
                    "slide_number": 6,
                    "title": "Go-To-Market (GTM) Strategy",
                    "bullets": [
                        "Direct integrations with founder newsletters and incubator lists.",
                        "SEO optimized landing page targeting validation tools keywords.",
                        "Product Hunt launch followed by active developer communities outreach."
                    ],
                    "visual_suggestion": "GTM Funnel graphic starting from Awareness (SEO/Directories) to Action (Submission)."
                },
                {
                    "slide_number": 7,
                    "title": "Financial Projection",
                    "bullets": [
                        "Year 1: 500 active subscribers, $300k Annual Recurring Revenue (ARR).",
                        "Year 2: 2,500 active subscribers, $1.5M ARR.",
                        "Year 3: Break-even target with 10k subscribers ($6M ARR)."
                    ],
                    "visual_suggestion": "Bar chart illustrating ARR growth projections over a 3-year period."
                },
                {
                    "slide_number": 8,
                    "title": "Team Overview",
                    "bullets": [
                        "CEO: 2x founder with prior exit in developer tools space.",
                        "CTO: Senior AI engineer ex-Big Tech.",
                        "Advisors: Venture partners and startup consultants."
                    ],
                    "visual_suggestion": "Three team profile cards showing photos, roles, and quick backgrounds."
                },
                {
                    "slide_number": 9,
                    "title": "The Ask: $500k Seed Round",
                    "bullets": [
                        "60% allocated to product development and engineering staff.",
                        "30% allocated to performance marketing and CAC optimization.",
                        "10% allocated to administrative, compliance, and cloud costs."
                    ],
                    "visual_suggestion": "Pie chart illustrating allocation of funding across the 3 categories."
                },
                {
                    "slide_number": 10,
                    "title": f"Join Us: Shape the Future of {idea.industry}",
                    "bullets": [
                        "Early beta launch completed with high retention.",
                        "Growing pipeline of founder sign-ups.",
                        "Contact: info@startupvalidationplatform.com"
                    ],
                    "visual_suggestion": "Clean typography slide with bold contact info and logo."
                }
            ]
        }

    try:
        return _call_gemini_json(prompt, system_instruction)
    except Exception:
        logger.warning("Gemini API call failed, using mock Pitch Deck fallback.")
        return {
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Startup Presentation",
                    "bullets": ["Slide bullet"],
                    "visual_suggestion": "Image"
                }
            ]
        }
