import os
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load the API Key from your .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

class Vitals(BaseModel):
    heart_rate: float
    breath_rate: float
    confidence: float

class BlackboxRequest(BaseModel):
    vitals: Vitals
    substance_toggle: str 
    active_meds: List[str]

@app.post("/score-vitals")
async def score_vitals(data: BlackboxRequest):
    hr = data.vitals.heart_rate
    br = data.vitals.breath_rate
    
    # 1. Immediate Safety Logic
    status = "STABLE"
    color = "#34C759" 
    
    if data.substance_toggle == "alcohol" and br < 12:
        status = "DANGER"
        color = "#FF3B30"
    elif hr > 130:
        status = "CAUTION"
        color = "#FFCC00"

    # 2. AI Interaction Reasoning
    prompt = f"User is on {data.active_meds} and using {data.substance_toggle}. HR: {hr}, BR: {br}. 10-word safety warning:"
    
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

# CRITICAL: This part actually starts the server!
if __name__ == "__main__":
    import uvicorn
    print("Starting GeekSafe Blackbox...")
    uvicorn.run(app, host="0.0.0.0", port=8000)