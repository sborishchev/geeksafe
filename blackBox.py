# TAB 2 FLOW: 
# Presage Video Scan -> Extract Vitals -> FastAPI -> Return Risk JSON
# Expected API Input:
# {
#   "substance": "alcohol",
#   "medication": "Xanax",
#   "heart_rate": 85,
#   "breathing_rate": 10,
#   "hrv_sdnn": 40.2,
#   "stress_index": 75
# }

import os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

# ---------- INITIALIZATION ----------
load_dotenv()
# Using the Gemini 2.0 client for advanced reasoning
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# ---------- REQUEST MODEL ----------
class VitalsRequest(BaseModel):
    substance: str
    medication: Optional[str] = "None"
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

# ---------- RISK ENGINE ----------
# Processes the physiological "Scan video" data
# requires: br and hr as integers from Presage SDK
# returns: status string and hex color code
def evaluate_physiological_risk(substance, br, hr, stress):
    status = "STABLE"
    color = "#34C759" # Green

    # Logic: Alcohol + Respiratory Depression (BR < 12)
    if substance.lower() == "alcohol" and br < 12:
        status = "DANGER"
        color = "#FF3B30" # Red
    
    # Logic: High Heart Rate or Peak Stress
    elif hr > 130 or stress > 80:
        status = "CAUTION"
        color = "#FFCC00" # Yellow
        
    return status, color

# ---------- AI ANALYSIS ----------
# Brief clinical summary of the vitals scan
def get_vitals_explanation(med, sub, hr, br, stress):
    prompt = (
        f"Briefly explain the risk of {sub} use with these vitals: "
        f"HR {hr}, BR {br}, Stress {stress}. Meds: {med}. "
        f"Max 150 characters."
    )
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception:
        return "Vitals monitored. Seek help if breathing becomes difficult."

# ---------- TAB 2 MAIN ENDPOINT ----------
@app.post("/score-vitals")
async def score_vitals(request: VitalsRequest):
    
    # 1. Run the Risk Engine on extracted vitals
    danger_level, ui_color = evaluate_physiological_risk(
        request.substance, 
        request.breathing_rate, 
        request.heart_rate, 
        request.stress_index
    )

    # 2. Generate the AI status message
    ai_status = get_vitals_explanation(
        request.medication,
        request.substance,
        request.heart_rate,
        request.breathing_rate,
        request.stress_index
    )

    # 3. Return the exact JSON file format requested
    return {
        "danger_level": danger_level,
        "color": ui_color,
        "status": ai_status,
        "vitals_confirmed": {
            "hr": request.heart_rate,
            "br": request.breathing_rate
        }
    }

# ---------- SERVER START ----------
if __name__ == "__main__":
    import uvicorn
    print("🚀 Tab 2 Backend: Vitals Processing Live...")
    uvicorn.run(app, host="0.0.0.0", port=8000)