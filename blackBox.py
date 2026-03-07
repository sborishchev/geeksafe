import os
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup Environment
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

# 2. Updated Model: medication is now Optional
class BlackboxRequest(BaseModel):
    substance: str
    medication: Optional[str] = None # Can be missing or null
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

@app.post("/score-vitals")
async def score_vitals(request_data: BlackboxRequest):
    # Extract values directly
    hr = request_data.heart_rate
    br = request_data.breathing_rate
    med = request_data.medication
    sub = request_data.substance
    stress = request_data.stress_index
    
    # 3. Hard-Coded Safety Logic
    status = "STABLE"
    color = "#34C759" # Green
    
    if sub.lower() == "alcohol" and br < 12:
        status = "DANGER"
        color = "#FF3B30" # Red
    elif hr > 130 or stress > 80:
        status = "CAUTION"
        color = "#FFCC00" # Yellow

    # 4. Gemini Reasoning
    # Adjusts prompt if medication is missing
    med_text = f"taking {med}" if med else "not taking any medication"
    prompt = (f"User is {med_text} and using {sub}. "
              f"Vitals: HR {hr}, BR {br}, Stress {stress}. "
              f"Give a 10-word clinical safety warning:")
    
    try:
        ai_response = model.generate_content(prompt)
        message = ai_response.text.strip()
    except:
        message = "Vitals monitored. Stay alert."

    return {
        "risk_level": status,
        "ui_color": color,
        "display_message": message
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 GeekSafe Blackbox is starting...")
    uvicorn.run(app, host="0.0.0.0", port=8000)