import json
import os
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai

app = FastAPI()

client = genai.Client(api_key=os.getenv("API_KEY"))
filename = "rules.json"


# expected api input:
# {
#   "query": "<active_ingredient_name_or_brand_name>"
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


class MedicationRequest(BaseModel):
    query: str


def extract_json(filename):
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None


def normalize_text(text):
    return text.strip().lower()


# finds the medicine associated with either a generic medication name
# or a brand name in the provided dictionary
# returns:
# {
#   "match_type": "generic" or "brand", 
#   "medication": { ...original medication dict... }
# }
def find_medicine(data, query):
    normalized_query = normalize_text(query)

    for medication in data["medications"]:
        generic_name = normalize_text(medication["name"])
        brand_name = normalize_text(medication.get("brand", ""))

        if generic_name == normalized_query:
            return {
                "match_type": "generic",
                "medication": medication
            }

        if brand_name and brand_name == normalized_query:
            return {
                "match_type": "brand",
                "medication": medication
            }

    return None


def find_drug_class(data, drug_class):
    for drug in data["rules"]:
        if drug["drug_class"] == drug_class:
            return drug
    return None


def risk_alcohol(query, data):
    lookup_result = find_medicine(data, query)

    if not lookup_result:
        return {
            "found": False,
            "query": query,
            "message": "Medication not found"
        }

    matched_medication = lookup_result["medication"]
    match_type = lookup_result["match_type"]

    rule = find_drug_class(data, matched_medication["drug_class"])

    if not rule:
        return {
            "found": True,
            "query": query,
            "matched_by": match_type,
            "medication": matched_medication["name"],
            "brand": matched_medication.get("brand"),
            "drug_class": matched_medication["drug_class"],
            "conflict": False,
            "message": "No alcohol conflict found"
        }

    return {
        "found": True,
        "query": query,
        "matched_by": match_type,
        "medication": matched_medication["name"],
        "brand": matched_medication.get("brand"),
        "drug_class": matched_medication["drug_class"],
        "substance": matched_medication.get("substance", rule.get("substance")),
        "conflict": True,
        "risk": rule["risk"],
        "reason": rule["reason"]
    }


def get_ai_analysis(result):
    if not result.get("conflict"):
        return None

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=(
            f"Briefly explain the risk of mixing {result['medication']} "
            f"(brand {result.get('brand', 'unknown')}) with alcohol. "
            f"Max 200 characters."
        )
    )

    return response.text


@app.get("/")
def home():
    return {"status": "GeekSafe backend running"}


@app.post("/check-alcohol-risk")
def check_alcohol_risk(request: MedicationRequest):
    data = extract_json(filename)

    if data is None:
        return {"error": "Could not load rules.json"}

    result = risk_alcohol(request.query, data)

    if result.get("conflict"):
        result["ai_analysis"] = "test"
        # later:
        # result["ai_analysis"] = get_ai_analysis(result)

    return result