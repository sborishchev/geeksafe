# expected api input:
# {
#   "medication":"<active_ingredient_name>"
# }

import json
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
import os

# initialize FastAPI
app = FastAPI()

# Gemini client
client = genai.Client(api_key=os.getenv("API_KEY"))

filename = "rules.json"


# ---------- REQUEST MODEL ----------
class MedicationRequest(BaseModel):
    medication: str


# ---------- LOAD JSON ----------
# extract_json(filename) extracts dictionary from a json
# returns dictionary
# requires: filename be a valid file in the directory
def extract_json(filename):
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None


# ---------- FIND MEDICATION ----------
# finds the medicien associated with a given main ingredient name in the provided dictionary
# requires: medicine_name be a string, data be a dictionary of the format {"medications":{}}
# returns: a dictionary containing information about the associated medicine, of the format
'''
   {
      "name": "name",
      "brand": "brand",
      "drug_class": "drug_class"
    }

'''
def find_medicine(data, medicine_name):
    medicine_name = medicine_name.lower()

    for medication in data["medications"]:
        if medication["name"].lower() == medicine_name:
            return medication

        if medication.get("brand", "").lower() == medicine_name:
            return medication

    return None


# ---------- FIND RULE ----------
# finds the rule associated with a given drug class in the provided dictionary
# requires: data be a valid dictionary, drug_class be a string or None
# returns: a dictionary of the format:
'''
 {
      "drug_class": "drug_class",
      "substance": "substance",
      "risk": "risk",
      "reason": "reason"
}

'''
def find_drug_class(data, drug_class):
    for drug in data["rules"]:
        if drug["drug_class"] == drug_class and drug["substance"] == "alcohol":
            return drug
    return None


# ---------- RISK ENGINE ----------
# returns the risk information associated with a given ingredient name
def risk_alcohol(medication, data):

    val = find_medicine(data, medication)

    if not val:
        return {
            "found": False,
            "message": "Medication not found"
        }

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


# ---------- AI EXPLANATION ----------
# returns an ai explanation of a risk situation, formatted as a string
def get_ai_analysis(result):

    if not result.get("conflict"):
        return None

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Briefly explain the risk of mixing {result['medication']} (brand {result.get('brand','unknown')}) with alcohol. Max 200 characters."
    )

    return response.text


# ---------- HEALTH CHECK ----------

# confirms runnign status of backend script
@app.get("/")
def home():
    return {"status": "GeekSafe backend running"}


# ---------- MAIN ENDPOINT ----------
@app.post("/check-alcohol-risk")
def check_alcohol_risk(request: MedicationRequest):

    data = extract_json(filename)

    if data is None:
        return {"error": "Could not load rules.json"}

    result = risk_alcohol(request.medication, data)

    if result.get("conflict"):
        result["ai_analysis"] = "test"

    return result