import json
import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from fastapi.middleware.cors import CORSMiddleware

# initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini client
client = genai.Client(api_key=os.getenv("API_KEY"))

filename = "rules.json"


# expected api input:
# {
#   "medication": "<active_ingredient_name_or_brand_name>",
#   "substance": "<alcohol_or_cannabis>"
# }


# expect api output:
# {
#   "found": true,
#   "query": "<original_query>",
#   "matched_by": "generic" or "brand",
#   "medication": "<generic_medication_name>",
#   "brand": "<brand_name_or_null>",
#   "drug_class": "<drug_class_name>",
#   "substance": ["subtances", "subtances"] or null,
#   "conflict": true or false,
#   "risk": "<risk_level_from_rules_json_or_null>",
#   "reason": "<reason_from_rules_json_or_null>",
#   "ai_analysis": "<brief_clinical_explanation_from_gemini_or_null>"
# }
# api  endpoint: POST /check-alcohol-risk

# ---------- REQUEST MODEL ----------
class MedicationRequest(BaseModel):
    medication: str
    substance: str


# ---------- LOAD JSON ----------
def extract_json(filename):
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None


# ---------- FIND MEDICATION ----------
def find_medicine(data, medicine_name):
    medicine_name = medicine_name.strip().lower()

    for medication in data["medications"]:
        if medication["name"].strip().lower() == medicine_name:
            return medication

        if medication.get("brand", "").strip().lower() == medicine_name:
            return medication

    return None


# ---------- FIND RULE ----------
def find_drug_class(data, drug_class, substance):
    substance = substance.strip().lower()

    for drug in data["rules"]:
        if (
            drug["drug_class"] == drug_class
            and substance in drug["substance"]
        ):
            return drug

    return None


# ---------- RISK ENGINE ----------
def risk_check(medication, substance, data):
    substance = substance.strip().lower()

    val = find_medicine(data, medication)

    if not val:
        return {
            "found": False,
            "medication": medication,
            "substance": substance,
            "message": "Medication not found"
        }

    rule = find_drug_class(data, val["drug_class"], substance)

    if not rule:
        return {
            "found": True,
            "medication": val["name"],
            "brand": val.get("brand"),
            "drug_class": val["drug_class"],
            "substance": substance,
            "conflict": False,
            "message": f"No {substance} conflict found"
        }

    return {
        "found": True,
        "medication": val["name"],
        "brand": val.get("brand"),
        "drug_class": val["drug_class"],
        "substance": substance,
        "conflict": True,
        "risk": rule["risk"],
        "reason": rule["reason"]
    }


# ---------- AI EXPLANATION ----------
def get_ai_analysis(result):
    if not result.get("conflict"):
        return None

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=(
            f"Briefly explain the risk of mixing {result['medication']} "
            f"(brand {result.get('brand', 'unknown')}) with {result['substance']}. "
            f"Max 200 characters."
        )
    )

    return response.text


# ---------- HEALTH CHECK ----------
@app.get("/")
def home():
    return {"status": "GeekSafe backend running"}


# ---------- MAIN ENDPOINT ----------
@app.post("/check-risk")
def check_risk(request: MedicationRequest):
    data = extract_json(filename)

    if data is None:
        return {"error": "Could not load rules.json"}

    result = risk_check(request.medication, request.substance, data)

    if result.get("conflict"):
        result["ai_analysis"] = "test"
        # later:
        # result["ai_analysis"] = get_ai_analysis(result)

    return result