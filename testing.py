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

# ---------- DYNAMIC MODE SELECTION ----------
# This prompt runs before the server starts to select your tab logic
print("="*30)
print("GEEKSAFE BACKEND MODE SELECTION")
print("1: Medication Conflict (Tab 1)")
print("2: Vitals & Physiological Analysis (Tab 2)")
print("="*30)
user_selection = input("Enter selection (1 or 2): ")

try:
    MODE = int(user_selection)
except ValueError:
    print("⚠️ Invalid input. Defaulting to Mode 2 (Vitals).")
    MODE = 2
# --------------------------------------------

load_dotenv()
app = FastAPI()

# Enable CORS for mobile app connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Initialization
api_key = os.getenv("API_KEY")
client = genai.Client(api_key=api_key)
RULES_FILENAME = "rules.json"

if MODE == 1:
    # =================================================================
    # PART 1: TAB 1 - MEDICATION CONFLICT LOGIC (Exactly as requested)
    # =================================================================
    class MedicationRequest(BaseModel):
        medication: str
        substance: str

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

    def medication_risk_check(med_name, sub_name, data):
        sub_name = sub_name.strip().lower()
        med = find_medicine(data, med_name)
        if not med:
            return {"found": False, "medication": med_name, "message": "Not found"}

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

    def get_med_ai_analysis(med, brand, substance):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=f"Briefly explain risk of mixing {med} (brand {brand}) with {substance}. Max 200 chars."
            )
            return response.text.strip()
        except Exception as e:
            print(f"⚠️ AI LIMIT HIT (Tab 1): {e}")
            return "Detailed AI analysis is offline. Refer to the specific risk warnings provided."

    @app.post("/check-risk")
    async def check_medication_risk_endpoint(request: MedicationRequest):
        data = extract_json(RULES_FILENAME)
        if not data: return {"error": "Could not load rules.json"}
        result = medication_risk_check(request.medication, request.substance, data)
        if result.get("conflict"):
            result["ai_analysis"] = get_med_ai_analysis(result['medication'], result.get('brand'), result['substance'])
        return result

elif MODE == 2:
    # =================================================================
    # PART 2: TAB 2 - VITALS & PHYSIOLOGICAL LOGIC (Exactly as requested)
    # =================================================================
    class VitalsRequest(BaseModel):
        substance: List[str]
        medication: Optional[str] = None
        heart_rate: int
        breathing_rate: int
        hrv_sdnn: float
        stress_index: int

    def evaluate_physiological_risk(substances, breathing_rate, heart_rate, hrv_sdnn, stress_index):
        subs = [s.strip().lower() for s in substances]
        if len(subs) > 1 and (breathing_rate < 13 or heart_rate > 120 or hrv_sdnn < 30 or stress_index > 75):
            return "DANGER", "#FF3B30", 10
        if "alcohol" in subs and breathing_rate < 12: return "DANGER", "#FF3B30", 9
        if "weed" in subs and heart_rate > 140: return "DANGER", "#FF3B30", 8
        if heart_rate > 155 or breathing_rate < 10 or stress_index > 95:
            return "DANGER", "#FF3B30", 10
        if len(subs) > 1: return "CAUTION", "#FFCC00", 7
        return "STABLE", "#34C759", 2

    def generate_vitals_analysis(danger_level, score, substances, heart_rate, breathing_rate, stress_index):
        substance_string = " and ".join(substances)
        prompt = (
            f"Timestamp: {time.time()}. You are a clinical health monitor. "
            f"User state: {danger_level} (Score {score}/10). Substances: {substance_string}. "
            f"Vitals: HR {heart_rate} bpm, BR {breathing_rate} rpm, Stress {stress_index}. "
            f"TASK: Write a smooth 50-70 word narrative report. "
            f"1. Start with the severity of the condition. "
            f"2. Explicitly identify which sensors are normal or 'out of range' (HR, BR, or Stress). "
            f"3. Command them to stop taking {substance_string} immediately. "
            f"4. Give one urgent human-like safety suggestion. "
            f"Tone: Supportive but firm. No lists. Change phrasing every single time."
        )
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=1.0, max_output_tokens=300,
                    safety_settings=[types.SafetySetting(
                        category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=types.HarmBlockThreshold.BLOCK_NONE
                    )]
                )
            )
            return response.text.strip()
        except Exception as e:
            print(f"❌ AI ERROR: {e}")
            return f"Condition: {danger_level}. HR: {heart_rate}, BR: {breathing_rate}. Stop taking {substance_string} immediately."

    @app.post("/check-vitals-risk")
    async def check_vitals_risk(request: VitalsRequest):
        risk_level, color, score = evaluate_physiological_risk(
            request.substance, request.breathing_rate, request.heart_rate, request.hrv_sdnn, request.stress_index
        )
        normalized_substances = [s.strip().lower() for s in request.substance]
        safety_analysis = generate_vitals_analysis(
            risk_level, score, normalized_substances, request.heart_rate, request.breathing_rate, request.stress_index
        )
        return {
            "risk": risk_level, "score": score, "color": color, "safety_analysis": safety_analysis,
            "vitals_confirmed": {
                "hr": request.heart_rate, "br": request.breathing_rate, 
                "hrv_sdnn": request.hrv_sdnn, "stress": request.stress_index
            },
            "substances": normalized_substances,
            "medication": request.medication
        }

# ---------- Global Launch ----------
@app.get("/")
@app.get("/ping")
def health_check():
    return {"status": "alive", "message": f"GeekSafe Mode {MODE} Backend Running"}

if __name__ == "__main__":
    import uvicorn
    # Listening on Port 8001 to avoid common conflicts
    uvicorn.run(app, host="0.0.0.0", port=8001)