import os
import time
import random
from typing import Optional, List
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ---------- Initialization ----------
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = FastAPI()

class VitalsRequest(BaseModel):
    substance: List[str] 
    medication: Optional[str] = None 
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

# ---------- Core Risk Engine ----------
def evaluate_physiological_risk(subs, br, hr, hrv, stress):
    subs = [s.lower() for s in subs]
    
    # 1. DANGER Logic
    if (len(subs) > 1 and (br < 13 or hr > 120 or hrv < 30 or stress > 75)):
        return "DANGER", "#FF3B30", 10
    if "alcohol" in subs and br < 12:
        return "DANGER", "#FF3B30", 9
    if "weed" in subs and hr > 140:
        return "DANGER", "#FF3B30", 8
    if hr > 155 or br < 10 or stress > 95:
        return "DANGER", "#FF3B30", 10

    # 2. CAUTION Logic
    if len(subs) > 1:
        return "CAUTION", "#FFCC00", 7

    # 3. STABLE Logic
    return "STABLE", "#34C759", 2

# ---------- Main API Endpoint ----------
@app.post("/score-vitals")
async def score_vitals(request: VitalsRequest):
    danger_level, ui_color, score = evaluate_physiological_risk(
        request.substance, request.breathing_rate, request.heart_rate, request.hrv_sdnn, request.stress_index
    )

    sub_str = " and ".join(request.substance)
    
    # PROMPT: Structured for length and variability
    prompt = (
        f"Generate a unique, long-form safety report (150-200 words). Token: {time.time()}. "
        f"User Status: {danger_level} (Score {score}/10). Substances: {sub_str}. "
        f"Vitals: HR {request.heart_rate}bpm, BR {request.breathing_rate}rpm, Stress {request.stress_index}. "
        f"1. Explain the physiological interaction between {sub_str} and a heart rate of {request.heart_rate}. "
        f"2. Detail why a breathing rate of {request.breathing_rate} is {danger_level} in this context. "
        f"3. Provide 3 specific, non-generic safety maneuvers or recovery steps. "
        f"Tone: Clinical but deeply human. Do not use repetitive intro phrases."
    )
    
    try:
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
                ]
            )
        )
        full_analysis = response.text.strip()
    except Exception as e:
        # Smart Dynamic Fallback based on your requested risk strings
        if danger_level == "DANGER":
            full_analysis = f"CRITICAL: Your breathing ({request.breathing_rate}) or heart rate ({request.heart_rate}) is in the red zone for {sub_str}. Stop intake immediately and call 911."
        elif danger_level == "CAUTION":
            full_analysis = f"CAUTION: Mixing {sub_str} is unpredictable. Your vitals are steady now, but you should find a safe place to rest and monitor your breathing."
        else:
            full_analysis = f"STABLE: Your vitals (HR: {request.heart_rate}) look healthy. Continue to monitor yourself and stay hydrated."

    return {
        "risk": danger_level,
        "score": score,
        "color": ui_color,
        "safety_analysis": full_analysis,
        "vitals_confirmed": {
            "hr": request.heart_rate, 
            "br": request.breathing_rate,
            "stress": request.stress_index
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)