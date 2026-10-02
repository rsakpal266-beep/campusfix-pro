"""FixBot AI Assistant routes with real Gemini & OpenAI integration (FastAPI)."""

import os
from typing import Optional, List, Dict
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from config import GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY
from database import get_db
from models import FixBotChatLog, User
from schemas import FixBotChatRequest, FixBotChatResponse
from security import get_current_user

router = APIRouter(prefix="/api/fixbot", tags=["FixBot AI"])

CAMPUSFIX_SYSTEM_PROMPT = """You are FixBot AI, the intelligent and friendly campus maintenance & repair assistant for CampusFix Pro.
You serve students, faculty members, technicians, and campus administrators.

Key Campus Knowledge:
1. Categories:
   - Electrical (Lights, fans, switchboards, ACs, power outlets, circuit breakers)
   - Plumbing (Taps, pipe leaks, flush tanks, washroom drainage, drinking fountains)
   - Furniture (Desks, rolling chairs, benches, whiteboards, lecture hall seating)
   - Cleaning (Washroom hygiene, campus corridors, dustbins, garden areas)
   - Internet / Network (Hostel Wi-Fi, lab ethernet jacks, campus routers, student portal access)
   - Classroom Equipment (Projectors, HDMI cables, smartboards, audio systems, lab tools)
   - Other (Doors, window latches, keys/locks, painting)

2. Ticket Lifecycle & Roles:
   - Student & Faculty: Can raise maintenance complaints and track ticket status in 'My Tickets'.
   - College Administrator: Reviews complaints, assigns technicians, onboards staff.
   - Technician: Inspects and repairs the problem, updates status to 'In Progress' and 'Resolved'.
   - Statuses: 'Submitted' -> 'In Progress' -> 'Resolved'.

3. Emergencies:
   - For electrical fire/sparks, gas leaks, or massive flooding, tell user to immediately evacuate the immediate area and call Campus Facilities Hotline: +91 98765 43210.

Keep responses concise, helpful, actionable, and formatted with clean bullet points or steps when appropriate.
"""


def _generate_fallback_response(prompt: str) -> Dict[str, any]:
    """Smart campus maintenance knowledge engine used when no external API key is active."""
    p = prompt.lower()

    if any(k in p for k in ["water", "leak", "plumb", "tap", "drain", "sink", "flush"]):
        return {
            "response": (
                "🔧 **Plumbing Issue Guidance:**\n\n"
                "1. If water is overflowing or continuously leaking, please notify nearby students/faculty and avoid slipping.\n"
                "2. Navigate to **'Raise Complaint'** in your sidebar.\n"
                "3. Select Category: **Plumbing**.\n"
                "4. Specify the exact location (e.g., *Block A, 1st Floor Restroom near stairs*).\n"
                "5. Set priority to **High** if water is spreading, or **Medium** for minor dripping.\n"
                "6. Our campus plumbing technician will be dispatched promptly!"
            ),
            "intent": "plumbing_guidance",
            "suggestions": ["How do I track my ticket?", "Who is the plumbing technician?", "Report an issue now"],
        }

    if any(k in p for k in ["fan", "light", "electric", "power", "switch", "spark", "plug", "socket", "ac"]):
        if any(k in p for k in ["spark", "fire", "shock", "smoke"]):
            return {
                "response": (
                    "⚠️ **ELECTRICAL HAZARD ALERT:**\n\n"
                    "• **Do NOT touch** any switches, cables, or damp walls near the spark/smoke.\n"
                    "• Keep others away from the area immediately.\n"
                    "• Contact the Campus Emergency Facilities line immediately: **+91 98765 43210**.\n"
                    "• Submit a **Critical Priority** ticket under **Electrical** so security & technicians are alerted."
                ),
                "intent": "electrical_emergency",
                "suggestions": ["Emergency contact numbers", "Raise Emergency Ticket"],
            }
        return {
            "response": (
                "💡 **Electrical Maintenance Guidance:**\n\n"
                "1. For non-working ceiling fans, tube lights, or AC cooling issues, go to **'Raise Complaint'**.\n"
                "2. Choose Category: **Electrical**.\n"
                "3. Provide the room number and appliance identifier (e.g., *Room 204, Fan #2 near the blackboard*).\n"
                "4. Our senior technician Rahul Patil handles electrical inspections."
            ),
            "intent": "electrical_guidance",
            "suggestions": ["How do I track my ticket?", "What does In Progress mean?", "Raise Complaint"],
        }

    if any(k in p for k in ["wifi", "wi-fi", "internet", "network", "ethernet", "lan"]):
        return {
            "response": (
                "🌐 **Campus Network & Wi-Fi Assistance:**\n\n"
                "1. First verify if your device's Wi-Fi is connected to 'Campus_Secure' or 'Hostel_Net'.\n"
                "2. If connectivity is down across the entire room/hall, submit a ticket under **'Internet / Network'**.\n"
                "3. Mention your location and whether the access point router lights are blinking red or off.\n"
                "4. Network tickets are typically reviewed within 1-2 hours on working days."
            ),
            "intent": "network_guidance",
            "suggestions": ["How long does resolution take?", "Raise Complaint", "Check ticket status"],
        }

    if any(k in p for k in ["projector", "hdmi", "smartboard", "speaker", "audio", "mic"]):
        return {
            "response": (
                "📽️ **Classroom Equipment Support:**\n\n"
                "1. Check if the HDMI / Type-C cable is securely plugged into the wall podium.\n"
                "2. Ensure the projector source is set to HDMI-1.\n"
                "3. If the lamp is flickering or showing a filter warning, report under **'Classroom Equipment'** with **High** priority so our AV team can assist before lectures."
            ),
            "intent": "classroom_equipment",
            "suggestions": ["Raise AV Complaint", "View My Tickets"],
        }

    if any(k in p for k in ["track", "status", "progress", "resolved", "pending"]):
        return {
            "response": (
                "🎫 **Understanding Ticket Statuses:**\n\n"
                "• **Submitted / Pending:** Your complaint is received and waiting for College Admin to review/dispatch.\n"
                "• **In Progress:** A specialized technician has been assigned and is actively working on the repair.\n"
                "• **Resolved:** Maintenance work has been completed! You can view resolution notes and give feedback in **'My Tickets'**."
            ),
            "intent": "ticket_status_info",
            "suggestions": ["Go to My Tickets", "How do I raise a complaint?"],
        }

    # Default friendly assistant response
    return {
        "response": (
            f"Hello! 👋 I'm **FixBot AI**, your CampusFix Pro maintenance assistant.\n\n"
            f"I can help you report issues, diagnose campus facility problems, explain priority levels, "
            f"and guide you through electrical, plumbing, network, and equipment requests.\n\n"
            f"*(Tip: You can ask specific questions like 'How do I report a water leak?' or 'What does In Progress mean?')*"
        ),
        "intent": "general_greeting",
        "suggestions": [
            "How do I report a water leakage?",
            "How do I report an electrical issue?",
            "How do I track my ticket?",
            "What does In Progress mean?",
        ],
    }


async def _call_gemini_api(prompt: str, api_key: str) -> str:
    """Invoke real Google Gemini model using Google Generative Language REST API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"{CAMPUSFIX_SYSTEM_PROMPT}\n\nUser Question: {prompt}"}
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 600,
        },
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
        elif res.status_code == 400:
            # Try 2.0-flash endpoint if 1.5-flash returned schema notice
            url2 = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            res2 = await client.post(url2, json=payload)
            if res2.status_code == 200:
                data2 = res2.json()
                candidates = data2.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        raise RuntimeError(f"Gemini API returned {res.status_code}: {res.text}")


async def _call_openai_api(prompt: str, api_key: str) -> str:
    """Invoke OpenAI / Groq compatible chat completions API."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": CAMPUSFIX_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 500,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        raise RuntimeError(f"OpenAI API returned {res.status_code}: {res.text}")


# -------------------------------------------------------------
# CHAT ENDPOINT
# -------------------------------------------------------------

@router.post("/chat", response_model=FixBotChatResponse)
async def fixbot_chat(
    payload: FixBotChatRequest,
    db: Session = Depends(get_db),
):
    prompt_text = payload.prompt.strip()
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Prompt text cannot be empty.")

    active_gemini_key = payload.api_key.strip() if (payload.api_key and payload.api_key.strip()) else GEMINI_API_KEY
    active_openai_key = OPENAI_API_KEY
    active_groq_key = GROQ_API_KEY

    ai_response = None
    provider_used = "rule_engine"
    intent_tag = "campus_assistant"
    suggestions = [
        "How do I track my ticket?",
        "How do I report an electrical issue?",
        "What does In Progress mean?",
    ]

    # 1. Attempt Gemini if API Key exists
    if active_gemini_key:
        try:
            ai_response = await _call_gemini_api(prompt_text, active_gemini_key)
            provider_used = "google_gemini"
            intent_tag = "real_gemini_llm"
        except Exception as e:
            print(f"[FixBot] Gemini API call notice: {e}. Falling back to internal engine.")

    # 2. Attempt OpenAI if key exists and Gemini wasn't used/failed
    if not ai_response and active_openai_key:
        try:
            ai_response = await _call_openai_api(prompt_text, active_openai_key)
            provider_used = "openai"
            intent_tag = "real_openai_llm"
        except Exception as e:
            print(f"[FixBot] OpenAI API call notice: {e}")

    # 3. Fallback to smart CampusFix knowledge base engine
    if not ai_response:
        fallback = _generate_fallback_response(prompt_text)
        ai_response = fallback["response"]
        intent_tag = fallback["intent"]
        suggestions = fallback["suggestions"]
        provider_used = "campusfix_agent"

    # Save to Table 12 (fixbot_chat_logs)
    try:
        chat_log = FixBotChatLog(
            user_id=None,
            session_id=payload.session_id or "default_session",
            prompt=prompt_text,
            response=ai_response,
            provider=provider_used,
            intent=intent_tag,
        )
        db.add(chat_log)
        db.commit()
    except Exception as log_err:
        print(f"[FixBot] Chat log save error: {log_err}")

    return {
        "status": "success",
        "response": ai_response,
        "intent": intent_tag,
        "provider": provider_used,
        "suggestions": suggestions,
    }


# -------------------------------------------------------------
# CHAT HISTORY
# -------------------------------------------------------------

@router.get("/history")
def get_fixbot_history(
    session_id: Optional[str] = "default_session",
    db: Session = Depends(get_db),
):
    logs = (
        db.query(FixBotChatLog)
        .filter(FixBotChatLog.session_id == session_id)
        .order_by(desc(FixBotChatLog.created_at))
        .limit(20)
        .all()
    )
    result = [
        {
            "id": log.id,
            "prompt": log.prompt,
            "response": log.response,
            "provider": log.provider,
            "created_at": log.created_at.isoformat(),
        }
        for log in reversed(logs)
    ]
    return {"status": "success", "history": result}
