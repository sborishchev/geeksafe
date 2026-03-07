# expected api input:
# {
#   "substance": "alcohol",
#   "medication": "Xanax",
#   "heart_rate": 80,
#   "breathing_rate": 16,
#   "hrv_sdnn": 45.5,
#   "stress_index": 20
# }

import os
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# ---------- INITIALIZATION ----------
# Load environment variables and configure Gemini AI
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Initialize FastAPI
app = FastAPI()


# ---------- REQUEST MODEL ----------
# Defines the expected flat JSON structure from the mobile frontend
# requires: substance be a string, vitals be integers/floats
class BlackboxRequest(BaseModel):
    substance: str
    medication: Optional[str] = None  # Medication name is optional
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int


# ---------- RISK ENGINE ----------
# Calculates safety status based on biometric thresholds and substance use
# requires: heart_rate, breathing_rate, and stress_index as numeric values
# returns: a dictionary containing risk_level and associated UI color
def calculate_risk(substance, br, hr, stress):
    status = "STABLE"
    color = "#34C759"  # Green

    # Check for Respiratory Depression (Alcohol + Low Breathing)
    if substance.lower() == "alcohol" and br < 12:
        status = "DANGER"
        color = "#FF3B30"  # Red
    
    # Check for Tachycardia or High Stress
    elif hr > 130 or stress > 80:
        status = "CAUTION"
        color = "#FFCC00"  # Yellow
        
    return status, color


# ---------- AI EXPLANATION ----------
# Generates a clinical safety warning using Gemini AI
# returns: string containing a short, clinical warning
def get_ai_warning(med, sub, hr, br, stress):
    med_text = f"taking {med}" if med else "not taking any medication"
    
    prompt = (f"User is {med_text} and using {sub}. "
              f"Vitals: HR {hr}, BR {br}, Stress {stress}. "
              f"Give a 10-word clinical safety warning:")
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Vitals monitored. Stay alert."


# ---------- MAIN ENDPOINT ----------
# Processes incoming vitals and returns the final safety assessment
@app.post("/score-vitals")
async def score_vitals(request_data: BlackboxRequest):
    
    # Extract values from the request
    hr = request_data.heart_rate
    br = request_data.breathing_rate
    med = request_data.medication
    sub = request_data.substance
    stress = request_data.stress_index

    # Determine risk level and UI color
    status, color = calculate_risk(sub, br, hr, stress)

    # Get AI-generated safety analysis
    message = get_ai_warning(med, sub, hr, br, stress)

    return {
        "risk_level": status,
        "ui_color": color,
        "display_message": message
    }


# ---------- SERVER START ----------
if __name__ == "__main__":
    import uvicorn
    print("🚀 GeekSafe Blackbox is starting...")
    # host="0.0.0.0" allows external devices (iPhone) to connect via local IP
    uvicorn.run(app, host="0.0.0.0", port=8000)