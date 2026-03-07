import os
from typing import Optional, List
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = FastAPI()

class VitalsRequest(BaseModel):
    substance: List[str]  # Must be a list like ["alcohol"]
    medication: Optional[str] = None 
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

# ---------- HOLISTIC RISK ENGINE ----------
def evaluate_physiological_risk(substances, br, hr, hrv, stress):
    # Convert all to lowercase for safety
    subs = [s.lower() for s in substances]
    is_alcohol = "alcohol" in subs
    is_weed = "weed" in subs
    is_cocaine = "cocaine" in subs
    
    status = "STABLE"
    color = "#34C759"
    score = 2

    # 1. CROSS-FADED / MULTI-DRUG MODE
    if len(subs) > 1:
        if br < 13 or hr > 120 or hrv < 30 or stress > 75:
            return "DANGER", "#FF3B30", 10
        return "CAUTION", "#FFCC00", 7

    # 2. SINGLE SUBSTANCE MODE
    if is_alcohol:
        if br < 12 or hr > 130 or hrv < 25:
            return "DANGER", "#FF3B30", 9
    elif is_weed or is_cocaine:
        if hr > 140 or stress > 85 or hrv < 20:
            return "DANGER", "#FF3B30", 8

    # 3. GLOBAL OVERRIDE
    if hr > 155 or br < 10 or stress > 95:
        return "DANGER", "#FF3B30", 10
        
    return status, color, score

@app.post("/score-vitals")
async def score_vitals(request: VitalsRequest):
    # Logging for demo
    print(f"📥 [SCAN] {request.substance} | HR:{request.heart_rate} BR:{request.breathing_rate}")

    danger_level, ui_color, score = evaluate_physiological_risk(
        request.substance, request.breathing_rate, request.heart_rate, request.hrv_sdnn, request.stress_index
    )

    # Safe medication string
    med_text = f" and taking {request.medication}" if request.medication else " and no meds"
    # Join list into string for the AI prompt
    sub_str = ", ".join(request.substance)

    prompt = (f"Assess medical risk for {sub_str}{med_text}. "
              f"Vitals: HR {request.heart_rate}, BR {request.breathing_rate}, "
              f"HRV {request.hrv_sdnn}, Stress {request.stress_index}. Max 150 chars.")
    
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        ai_status = response.text.strip()
    except:
        ai_status = "Vitals processed. Monitor for changes."

    return {
        "danger_level": danger_level,
        "color": ui_color,
        "risk_score": score,
        "status": ai_status,
        "vitals_confirmed": {"hr": request.heart_rate, "br": request.breathing_rate}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)