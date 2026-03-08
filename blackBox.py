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

# DEBUG: Check if the API Key is loading correctly
api_key = os.getenv("API_KEY")
if not api_key:
    print("❌ ERROR: No API_KEY found in .env file!")
else:
    print(f"✅ API_KEY loaded successfully: {api_key[:5]}***")

app = FastAPI()

# Enable CORS for mobile app connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
client = genai.Client(api_key=api_key)

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
    subs = [s.strip().lower() for s in substances]

    # 1. DANGER logic (Level 10: Multi-substance conflict)
    if len(subs) > 1 and (
        breathing_rate < 13
        or heart_rate > 120
        or hrv_sdnn < 30
        or stress_index > 75
    ):
        return "DANGER", "#FF3B30", 10

    # 2. Substance-Specific Danger
    if "alcohol" in subs and breathing_rate < 12:
        return "DANGER", "#FF3B30", 9

    if "weed" in subs and heart_rate > 140:
        return "DANGER", "#FF3B30", 8

    # 3. Global System Fail-safe
    if heart_rate > 155 or breathing_rate < 10 or stress_index > 95:
        return "DANGER", "#FF3B30", 10

    # 4. CAUTION logic
    if len(subs) > 1:
        return "CAUTION", "#FFCC00", 7

    # 5. STABLE logic
    return "STABLE", "#34C759", 2

# ---------- AI Detailed Analysis ----------
def generate_vitals_analysis(
    danger_level: str,
    score: int,
    substances: List[str],
    heart_rate: int,
    breathing_rate: int,
    stress_index: int,
):
    substance_string = " and ".join(substances)

    # REFINED PROMPT: 50-70 words, specific sensors, stop order, and suggestion
    prompt = (
        f"Timestamp: {time.time()}. You are a clinical health monitor. "
        f"User state: {danger_level} (Score {score}/10). "
        f"Substances: {substance_string}. "
        f"Vitals: HR {heart_rate} bpm, BR {breathing_rate} rpm, Stress {stress_index}. "
        f"TASK: Write a smooth 50-70 word narrative report. "
        f"1. Start with the severity of the condition. "
        f"2. Explicitly identify which sensors are normal or 'out of range' (HR, BR, or Stress). "
        f"3. Command them to stop taking {substance_string} immediately. "
        f"4. Give one urgent human-like safety suggestion (e.g., call 911, find a friend). "
        f"Tone: Supportive but firm. No lists. Change phrasing every single time."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=1.0, # Forces variation every time
                max_output_tokens=300,
                safety_settings=[
                    types.SafetySetting(
                        category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=types.HarmBlockThreshold.BLOCK_NONE,
                    )
                ],
            ),
        )
        return response.text.strip()
    except Exception as e:
        print(f"❌ AI ERROR: {e}") # This will show you why the AI fails in the terminal
        return f"Condition: {danger_level}. Your HR is {heart_rate} and BR is {breathing_rate}. Stop taking {substance_string} and monitor your vitals closely with a friend."

# ---------- API Endpoints ----------
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

    safety_analysis = generate_vitals_analysis(
        danger_level=risk_level,
        score=score,
        substances=normalized_substances,
        heart_rate=request.heart_rate,
        breathing_rate=request.breathing_rate,
        stress_index=request.stress_index,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)