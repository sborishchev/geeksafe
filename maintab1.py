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
    return {"status": "alive", "message": "GeekSafe Medication Backend Running"}

@app.post("/check-risk")
async def check_medication_risk_endpoint(request: MedicationRequest):
    data = extract_json(RULES_FILENAME)
    if not data: return {"error": "Could not load rules.json"}
    
    result = medication_risk_check(request.medication, request.substance, data)
    if result.get("conflict"):
        # This keeps the AI generation call active for confirmed conflicts
        result["ai_analysis"] = get_med_ai_analysis(result['medication'], result.get('brand'), result['substance'])
    return result

if __name__ == "__main__":
    import uvicorn
    # Keeping this on port 8000 for your Tab 1 logic
    uvicorn.run(app, host="0.0.0.0", port=8000)