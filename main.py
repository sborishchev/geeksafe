import json
from google import genai
_api_key = "AIzaSyBePlruplZm-0UYhcEtfVetooCbF33kkyE"

client = genai.Client(api_key = _api_key)

filename = "rules.json"


def extract_json(filename):
    try:
        with open(filename, "r") as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        print("Error: file not found,", filename)
        return None
    except json.JSONDecodeError:
        print("Failed to decode JSON, invalid format")
        return None


def find_medicine(data, medicine_name):
    for medication in data["medications"]:
        if medication["name"] == medicine_name:
            return medication
    return None


def find_drug_class(data, drug_class):
    for drug in data["rules"]:
        if drug["drug_class"] == drug_class and drug["substance"] == "alcohol":
            return drug
    return None


# risk_alcohol(medication, data) calculates the risk value of a certain
# medication with alcohol, and returns a JSON object containing the risk
# level and the conflicting drug class rule.
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


def get_ai_analysis(data):
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents = f"briefly analyze the risks of taking {data['medication']} by brand {data['brand']} with {data['substance']}, be concise less than 200 characters"
    )
    
    return(response.text)


data = extract_json(filename)


if data is not None:
    result = (risk_alcohol("alprazolam", data))
    print(result)
    print(get_ai_analysis(result))
