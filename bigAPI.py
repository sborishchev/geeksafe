# TAB 1 PAYLOAD
# {
#   "medication":"<active_ingredient_name>"
# }

# TAB 1 RESPONSE

# TAB 2 PAYLOAD
# {
#   "substance": "alcohol",
#   "medication": "Xanax",
#   "heart_rate": 85,
#   "breathing_rate": 10,
#   "hrv_sdnn": 40.2,
#   "stress_index": 75
# }

# TAB 2 RESPONSE
# {
#         "danger_level": danger_level,
#         "color": ui_color,
#         "risk_score": score,
#         "status": ai_status,
#         "vitals_confirmed": {
#             "hr": request.heart_rate,
#             "br": request.breathing_rate
#       }
# }

import json
import os
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

# ---------- INITIALIZATION ----------
load_dotenv()
app = FastAPI()

# Using a single key for both functionalities
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
client = genai.Client(api_key=API_KEY)
filename = "rules.json"

# ---------- REQUEST MODELS ----------

class MedicationRequest(BaseModel):
    # Tab 1: OCR input
    medication: str 

class VitalsRequest(BaseModel):
    # Tab 2: Vitals input
    substance: str
    medication: Optional[str] = "None"
    heart_rate: int
    breathing_rate: int
    hrv_sdnn: float
    stress_index: int

# ---------- SHARED HELPERS ----------

def extract_json(filename):
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def find_medicine(data, medicine_name):
    query = medicine_name.lower()
    for medication in data["medications"]:
        if medication["name"].lower() == query:
            return medication
        if medication.get("brand", "").lower() == query:
            return medication
    return None

# ---------- TAB 1 LOGIC (Medication) ----------

def find_drug_class(data, drug_class):
    for drug in data["rules"]:
        # Logic remains specific to Alcohol as per your request
        if drug["drug_class"] == drug_class and drug["substance"] == "alcohol":
            return drug
    return None

def risk_alcohol(medication, data):
    val = find_medicine(data, medication)
    if not val:
        return {"found": False, "message": "Medication not found"}

    rule = find_drug_class(data, val["drug_class"])
    if not rule:
        return {
            "found": True,
            "medication": val["name"],
            "brand": val.get("brand"),
            "drug_class": val["drug_class"],
            "conflict": False,
            "message": "No alcohol conflict found"
        }

    return {
        "found": True,
        "medication": val["name"],
        "brand": val.get("brand"),
        "drug_class": val["drug_class"],
        "substance": "alcohol",
        "conflict": True,
        "risk": rule["risk"],
        "reason": rule["reason"]
    }

def get_ai_analysis(result):
    if not result.get("conflict"):
        return None
    prompt = f"Briefly explain the risk of mixing {result['medication']} (brand {result.get('brand','unknown')}) with alcohol. Max 200 characters."
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text.strip()
    except:
        return "Interaction risk detected. Consult a professional."

# ---------- TAB 2 LOGIC (Vitals) ----------

def evaluate_physiological_risk(substance, br, hr, stress):
    status = "STABLE"
    color = "#34C759" 
    score = 2

    # Logic: Alcohol + Respiratory Depression
    if substance.lower() == "alcohol" and br < 12:
        status = "DANGER"
        color = "#FF3B30"
        score = 9
    # Logic: High Heart Rate or Peak Stress
    elif hr > 130 or stress > 80:
        status = "CAUTION"
        color = "#FFCC00"
        score = 6
    return status, color, score

def get_vitals_explanation(med, sub, hr, br, stress):
    prompt = (f"Briefly explain the risk of {sub} use with these vitals: "
              f"HR {hr}, BR {br}, Stress {stress}. Meds: {med}. Max 150 characters.")
    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text.strip()
    except:
        return "Vitals monitored. Seek help if breathing becomes difficult."

# ---------- ENDPOINTS ----------

@app.get("/")
def home():
    return {"status": "GeekSafe Unified Backend Running"}

@app.post("/check-alcohol-risk")
def check_alcohol_risk(request: MedicationRequest):
    data = extract_json(filename)
    if data is None:
        return {"error": "Could not load rules.json"}
    
    result = risk_alcohol(request.medication, data)
    if result.get("conflict"):
        result["ai_analysis"] = get_ai_analysis(result)
    return result

@app.post("/score-vitals")
async def score_vitals(request: VitalsRequest):
    danger_level, ui_color, score = evaluate_physiological_risk(
        request.substance, request.breathing_rate, request.heart_rate, request.stress_index
    )
    ai_status = get_vitals_explanation(
        request.medication, request.substance, request.heart_rate, request.breathing_rate, request.stress_index
    )
    return {
        "danger_level": danger_level,
        "color": ui_color,
        "risk_score": score,
        "status": ai_status,
        "vitals_confirmed": {"hr": request.heart_rate, "br": request.breathing_rate}
    }

# ---------- SERVER START ----------
if __name__ == "__main__":
    import uvicorn
    print("🚀 GeekSafe Unified Backend: Live on Port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)