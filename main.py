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

class ImageRequest(BaseModel):
    image_base64: str

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

# ---------- AI Generation Functions ----------

def generate_vitals_analysis(risk: str, score: int, subs: List[str], hr: int, br: int, stress: int):
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
        return "Vitals analysis is temporarily unavailable due to high traffic. Please proceed with caution based on your clinical risk score."

def get_med_ai_analysis(med, brand, substance):
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Briefly explain risk of mixing {med} (brand {brand}) with {substance}. Max 200 chars."
        )
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ AI LIMIT HIT: {e}")
        return "Detailed AI analysis is currently offline. Refer to the specific risk warnings provided above."

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
        # You can toggle 'test' or actual AI here
        result["ai_analysis"] = get_med_ai_analysis(result['medication'], result.get('brand'), result['substance'])
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

@app.post("/extract-medication")
async def extract_medication_endpoint(request: ImageRequest):
    try:
        # Send the base64 image to Gemini for text extraction
        prompt = "Look at this medication label. Extract ONLY the medication or active ingredient name. Do not include dosages, instructions, brand names if active ingredient is present, or any other text. Just the core medication name. If you cannot find one, reply with 'Unknown'."
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, types.Part.from_bytes(data=request.image_base64.encode("utf-8"), mime_type="image/jpeg")]
        )
        return {"medication": response.text.strip()}
    except Exception as e:
        print(f"⚠️ OCR ERROR: {e}")
        return {"error": "Failed to extract medication from image."}