

import os
import time
from typing import Optional, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ---------- Initialization ----------
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("API_KEY"))


# ---------- Request Model ----------
class VitalsRequest(BaseModel):
    substance: List[str]
    medication: Optional[str] = None
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int


# ---------- Core Risk Engine ----------
def evaluate_physiological_risk(
    substances: List[str],
    breathing_rate: int,
    heart_rate: int,
    hrv_sdnn: float,
    stress_index: int,
):
    normalized_substances = [s.strip().lower() for s in substances]

    # 1. DANGER logic
    if len(normalized_substances) > 1 and (
        breathing_rate < 13
        or heart_rate > 120
        or hrv_sdnn < 30
        or stress_index > 75
    ):
        return "DANGER", "#FF3B30", 10

    if "alcohol" in normalized_substances and breathing_rate < 12:
        return "DANGER", "#FF3B30", 9

    if "weed" in normalized_substances and heart_rate > 140:
        return "DANGER", "#FF3B30", 8

    if heart_rate > 155 or breathing_rate < 10 or stress_index > 95:
        return "DANGER", "#FF3B30", 10

    # 2. CAUTION logic
    if len(normalized_substances) > 1:
        return "CAUTION", "#FFCC00", 7

    # 3. STABLE logic
    return "STABLE", "#34C759", 2


# ---------- AI Explanation ----------
def generate_vitals_analysis(
    danger_level: str,
    score: int,
    substances: List[str],
    heart_rate: int,
    breathing_rate: int,
    stress_index: int,
):
    substance_string = " and ".join(substances)

    prompt = (
        f"Generate a unique safety report in 150-200 words. Token: {time.time()}. "
        f"User status: {danger_level} (score {score}/10). "
        f"Substances: {substance_string}. "
        f"Vitals: HR {heart_rate} bpm, BR {breathing_rate} rpm, Stress {stress_index}. "
        f"Explain the physiological concerns clearly. "
        f"Explain why these vitals matter in this context. "
        f"Provide 3 specific safety steps. "
        f"Tone: clinical but human. Avoid repetitive opening phrases."
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.95,
            max_output_tokens=500,
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                )
            ],
        ),
    )

    return response.text.strip()


# ---------- Fallback Explanation ----------
def fallback_vitals_analysis(
    danger_level: str,
    substances: List[str],
    heart_rate: int,
    breathing_rate: int,
):
    substance_string = " and ".join(substances)

    if danger_level == "DANGER":
        return (
            f"CRITICAL: Your breathing rate ({breathing_rate}) or heart rate "
            f"({heart_rate}) is in the red zone for {substance_string}. "
            f"Stop intake immediately and seek emergency help."
        )

    if danger_level == "CAUTION":
        return (
            f"CAUTION: Mixing {substance_string} is unpredictable. "
            f"Your vitals are not yet critical, but you should rest, avoid more intake, "
            f"and monitor breathing closely."
        )

    return (
        f"STABLE: Your current vitals do not indicate immediate danger. "
        f"Continue monitoring yourself, stay hydrated, and avoid increasing intake."
    )


# ---------- Health Check ----------
@app.get("/")
def home():
    return {"status": "GeekSafe backend running"}


@app.get("/ping")
def ping():
    return {"status": "alive"}


# ---------- Second Tab Endpoint ----------
@app.post("/check-vitals-risk")
async def check_vitals_risk(request: VitalsRequest):
    risk_level, color, score = evaluate_physiological_risk(
        request.substance,
        request.breathing_rate,
        request.heart_rate,
        request.hrv_sdnn,
        request.stress_index,
    )

    normalized_substances = [s.strip().lower() for s in request.substance]

    try:
        safety_analysis = generate_vitals_analysis(
            danger_level=risk_level,
            score=score,
            substances=normalized_substances,
            heart_rate=request.heart_rate,
            breathing_rate=request.breathing_rate,
            stress_index=request.stress_index,
        )
    except Exception:
        safety_analysis = fallback_vitals_analysis(
            danger_level=risk_level,
            substances=normalized_substances,
            heart_rate=request.heart_rate,
            breathing_rate=request.breathing_rate,
        )

    return {
        "risk": risk_level,
        "score": score,
        "color": color,
        "safety_analysis": safety_analysis,
        "vitals_confirmed": {
            "hr": request.heart_rate,
            "br": request.breathing_rate,
            "hrv_sdnn": request.hrv_sdnn,
            "stress": request.stress_index,
        },
        "substances": normalized_substances,
        "medication": request.medication,
    }