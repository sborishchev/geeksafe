import os
import time
import json
from typing import Optional, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ---------- Initialization ----------
load_dotenv() # Loads variables from .env

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DEBUG: Check if the key is loading (Look for this in your terminal!)
# Ensure your .env has: API_KEY=AIzaSyDNmM4EfdoBIAUawjvRn-vAwkfM0c6Tslw
api_key_val = os.getenv("API_KEY")
if not api_key_val:
    print("❌ ERROR: 'API_KEY' not found in .env! Check your variable naming.")
else:
    print(f"✅ API_KEY detected: {api_key_val[:5]}***")

client = genai.Client(api_key=api_key_val)
RULES_FILENAME = "rules.json"

# ---------- Request Models ----------

class VitalsRequest(BaseModel):
    substance: List[str]
    medication: Optional[str] = None
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

class MedicationRequest(BaseModel):
    medication: str
    substance: str

# ---------- Core Logic Engines ----------

def evaluate_physiological_risk(substances: List[str], br: int, hr: int, hrv: float, stress: int):
    norm_subs = [s.strip().lower() for s in substances]
    
    # DANGER logic (Level 10: Multi-substance conflict)
    if len(norm_subs) > 1 and (br < 13 or hr > 120 or hrv < 30 or stress > 75):
        return "DANGER", "#FF3B30", 10
    
    # Substance-Specific Danger
    if "alcohol" in norm_subs and br < 12:
        return "DANGER", "#FF3B30", 9
    if "weed" in norm_subs and hr > 140:
        return "DANGER", "#FF3B30", 8
    
    # Global Fail-safe
    if hr > 155 or br < 10 or stress > 95:
        return "DANGER", "#FF3B30", 10
        
    # CAUTION logic
    if len(norm_subs) > 1:
        return "CAUTION", "#FFCC00", 7
        
    return "STABLE", "#34C759", 2

# ---------- AI Generation Functions ----------

def generate_vitals_analysis(risk: str, score: int, subs: List[str], hr: int, br: int, stress: int):
    # This prompt forces the 50-70 word structure you requested
    prompt = (
        f"Timestamp: {time.time()}. Act as a clinical monitor. "
        f"Status: {risk} (Score {score}/10). Substances: {' and '.join(subs)}. "
        f"Vitals: HR {hr} bpm, BR {br} rpm, Stress Index {stress}. "
        f"Instructions: Write a smooth 50-70 word report. "
        f"1. State condition severity. 2. Identify specific out-of-range sensors (HR, BR, or Stress). "
        f"3. Command them to stop taking {' and '.join(subs)} immediately. "
        f"4. Provide one human-like safety suggestion. Tone: empathetic but firm. No lists."
    )
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=1.0, # Ensures variety every time
            max_output_tokens=400,
            safety_settings=[types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_NONE # Prevents refusal
            )]
        )
    )
    return response.text.strip()

# ---------- Endpoints ----------

@app.get("/")
@app.get("/ping")
def health_check():
    return {"status": "alive", "message": "GeekSafe Unified Backend Running"}

@app.post("/check-vitals-risk")
async def check_vitals_risk_endpoint(request: VitalsRequest):
    risk_level, color, score = evaluate_physiological_risk(
        request.substance, request.breathing_rate, request.heart_rate, request.hrv_sdnn, request.stress_index
    )
    
    try:
        analysis = generate_vitals_analysis(
            risk_level, score, request.substance, request.heart_rate, request.breathing_rate, request.stress_index
        )
    except Exception as e:
        # This will tell you exactly why the AI call is failing in your terminal!
        print(f"❌ AI CALL FAILED: {e}") 
        analysis = f"Vitals check: {risk_level}. HR: {request.heart_rate} bpm, BR: {request.breathing_rate} rpm. Please monitor your status closely and avoid further intake."

    return {
        "risk": risk_level,
        "score": score,
        "color": color,
        "safety_analysis": analysis,
        "vitals_confirmed": {
            "hr": request.heart_rate, "br": request.breathing_rate, "stress": request.stress_index
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)