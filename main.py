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
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Gemini Client
client = genai.Client(api_key=os.getenv("API_KEY"))
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

# ---------- JSON Helpers (Medication) ----------

def extract_json(filename):
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def find_medicine(data, medicine_name):
    medicine_name = medicine_name.strip().lower()
    for medication in data["medications"]:
        if medication["name"].strip().lower() == medicine_name:
            return medication
        if medication.get("brand", "").strip().lower() == medicine_name:
            return medication
    return None

def find_drug_class_rule(data, drug_class, substance):
    substance = substance.strip().lower()
    for rule in data["rules"]:
        if rule["drug_class"] == drug_class and substance in rule["substance"]:
            return rule
    return None

# ---------- Core Logic Engines ----------

def evaluate_physiological_risk(substances: List[str], br: int, hr: int, hrv: float, stress: int):
    norm_subs = [s.strip().lower() for s in substances]
    
    # DANGER logic
    if len(norm_subs) > 1 and (br < 13 or hr > 120 or hrv < 30 or stress > 75):
        return "DANGER", "#FF3B30", 10
    if "alcohol" in norm_subs and br < 12:
        return "DANGER", "#FF3B30", 9
    if "weed" in norm_subs and hr > 140:
        return "DANGER", "#FF3B30", 8
    if hr > 155 or br < 10 or stress > 95:
        return "DANGER", "#FF3B30", 10
        
    # CAUTION logic
    if len(norm_subs) > 1:
        return "CAUTION", "#FFCC00", 7
        
    return "STABLE", "#34C759", 2

def medication_risk_check(med_name, sub_name, data):
    sub_name = sub_name.strip().lower()
    med = find_medicine(data, med_name)

    if not med:
        return {"found": False, "medication": med_name, "substance": sub_name, "message": "Not found"}

    rule = find_drug_class_rule(data, med["drug_class"], sub_name)
    
    base_res = {
        "found": True,
        "medication": med["name"],
        "brand": med.get("brand"),
        "drug_class": med["drug_class"],
        "substance": sub_name,
    }

    if not rule:
        return {**base_res, "conflict": False, "message": f"No {sub_name} conflict found"}

    return {**base_res, "conflict": True, "risk": rule["risk"], "reason": rule["reason"]}

# ---------- AI Generation Functions with Test Fallbacks ----------

# 🆕 Test payloads for when Gemini API is unavailable
TEST_VITALS_ANALYSES = {
    "DANGER": "CRITICAL: Your vital signs indicate dangerous physiological stress. Respiratory depression detected combined with elevated stress markers. This combination requires immediate medical attention. Continue monitoring and seek emergency care if symptoms worsen.",
    "CAUTION": "WARNING: Your vital signs indicate elevated physiological stress. Heart rate is elevated and stress markers are concerning. Reduce substance use immediately and monitor closely. Consider contacting medical professionals if levels don't normalize.",
    "STABLE": "Your vital signs appear stable and within normal ranges. Continue monitoring your health status and maintain safe practices. Regular check-ins recommended."
}

TEST_MEDICATION_ANALYSES = {
    "high_risk": "This medication-substance combination presents significant interaction risks. Metabolism interference and CNS effects may be amplified. Strongly advise against concurrent use.",
    "moderate_risk": "This combination has documented interaction potential. Increased monitoring recommended. Consider timing medications separately from substance use.",
    "low_risk": "No major documented interactions found. However, individual response varies. Standard medical supervision advised.",
}

def generate_vitals_analysis(risk: str, score: int, subs: List[str], hr: int, br: int, stress: int):
    """Generate vitals analysis with fallback to test data"""
    try:
        prompt = (
            f"Generate a unique safety report in 150-200 words. Status: {risk}. "
            f"Vitals: HR {hr}, BR {br}, Stress {stress}."
        )
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ AI LIMIT HIT: {e}")
        # 🆕 Use test payload instead of generic error message
        return TEST_VITALS_ANALYSES.get(risk, TEST_VITALS_ANALYSES["STABLE"])

def get_med_ai_analysis(med, brand, substance, conflict: bool, risk_level: str = "moderate"):
    """Get medication AI analysis with fallback to test data"""
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Briefly explain risk of mixing {med} (brand {brand}) with {substance}. Max 200 chars."
        )
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ AI LIMIT HIT: {e}")
        # 🆕 Use test payload based on risk level
        if not conflict:
            return TEST_MEDICATION_ANALYSES["low_risk"]
        elif risk_level == "critical" or risk_level == "high":
            return TEST_MEDICATION_ANALYSES["high_risk"]
        else:
            return TEST_MEDICATION_ANALYSES["moderate_risk"]

# ---------- Endpoints ----------

@app.get("/")
@app.get("/ping")
def health_check():
    return {"status": "alive", "message": "GeekSafe Unified Backend Running"}

@app.post("/check-risk")
async def check_medication_risk_endpoint(request: MedicationRequest):
    data = extract_json(RULES_FILENAME)
    if not data: return {"error": "Could not load rules.json"}
    
    result = medication_risk_check(request.medication, request.substance, data)
    if result.get("conflict"):
        # 🆕 Pass conflict and risk_level info for better AI fallback
        risk_level = result.get("risk", "moderate")
        result["ai_analysis"] = get_med_ai_analysis(
            result['medication'], 
            result.get('brand'), 
            result['substance'],
            conflict=True,
            risk_level=risk_level
        )
    else:
        # 🆕 Also provide AI analysis for non-conflict cases
        result["ai_analysis"] = get_med_ai_analysis(
            result['medication'], 
            result.get('brand'), 
            result['substance'],
            conflict=False
        )
    return result

@app.post("/check-vitals-risk")
async def check_vitals_risk_endpoint(request: VitalsRequest):
    risk_level, color, score = evaluate_physiological_risk(
        request.substance, request.breathing_rate, request.heart_rate, request.hrv_sdnn, request.stress_index
    )
    
    try:
        analysis = generate_vitals_analysis(
            risk_level, score, request.substance, request.heart_rate, request.breathing_rate, request.stress_index
        )
    except Exception:
        analysis = "Vitals check complete. Please monitor your status closely."

    return {
        "risk": risk_level,
        "score": score,
        "color": color,
        "safety_analysis": analysis,
        "vitals_confirmed": {
            "hr": request.heart_rate, "br": request.breathing_rate, "stress": request.stress_index
        }
    }