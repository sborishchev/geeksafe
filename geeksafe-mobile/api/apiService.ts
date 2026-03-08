// src/api/apiService.ts

import { TEST_CONFIG } from './testConfig';

// 🟢 STEP 1: Ensure NO trailing slash here
const NGROK_URL = "https://alexa-unfoaming-terrell.ngrok-free.dev";

export interface VitalsData {
    substance: string[];
    medication?: string;
    heart_rate: number;
    breathing_rate: number;
    hrv_sdnn: number;
    stress_index: number;
}

// 🆕 Mock test payloads for medication risk
const mockMedicationResponses: { [key: string]: any } = {
    "ibuprofen_alcohol": {
        found: true,
        medication: "Ibuprofen",
        brand: "Advil",
        drug_class: "NSAID",
        substance: "alcohol",
        conflict: true,
        risk: "high",
        reason: "NSAIDs combined with alcohol increase risk of gastrointestinal bleeding and liver damage.",
        ai_analysis: "Ibuprofen metabolism is inhibited by alcohol, leading to increased drug concentration and toxicity risk. The combination significantly increases gastric ulceration risk.",
        message: "Danger - conflict detected"
    },
    "xanax_alcohol": {
        found: true,
        medication: "Xanax",
        brand: "Alprazolam",
        drug_class: "Benzodiazepine",
        substance: "alcohol",
        conflict: true,
        risk: "critical",
        reason: "Benzodiazepines with alcohol cause severe CNS depression, respiratory failure, and overdose risk.",
        ai_analysis: "Combining Xanax with alcohol dramatically increases CNS depression. Both substances are central nervous system depressants that synergistically amplify their effects, creating dangerous respiratory and cardiac risks.",
        message: "Danger - critical conflict detected"
    },
    "xanax_cannabis": {
        found: true,
        medication: "Xanax",
        brand: "Alprazolam",
        drug_class: "Benzodiazepine",
        substance: "cannabis",
        conflict: true,
        risk: "high",
        reason: "Benzodiazepines with cannabis increase CNS depression and sedation risk.",
        ai_analysis: "Combining Xanax with cannabis significantly increases sedation and CNS depression. Both are central nervous system depressants that can impair judgment and create dangerous interactions.",
        message: "Danger - conflict detected"
    },
    "xanax_both": {
        found: true,
        medication: "Xanax",
        brand: "Alprazolam",
        drug_class: "Benzodiazepine",
        substance: "both",
        conflict: true,
        risk: "critical",
        reason: "Benzodiazepines with both alcohol and cannabis create severe CNS depression and overdose risk.",
        ai_analysis: "Combining Xanax with both alcohol and cannabis creates critically dangerous CNS depression. This combination severely increases overdose risk and respiratory failure potential. Seek immediate medical attention.",
        message: "Danger - critical conflict detected"
    },
    "acetaminophen_alcohol": {
        found: true,
        medication: "Acetaminophen",
        brand: "Tylenol",
        drug_class: "Analgesic",
        substance: "alcohol",
        conflict: true,
        risk: "moderate",
        reason: "Combined use increases risk of liver toxicity and acetaminophen overdose.",
        ai_analysis: "Alcohol enhances acetaminophen's hepatotoxic potential. Regular alcohol consumption with acetaminophen significantly elevates liver damage risk.",
        message: "Warning - conflict detected"
    },
    "aspirin_cannabis": {
        found: true,
        medication: "Aspirin",
        brand: "Bayer",
        drug_class: "NSAID",
        substance: "cannabis",
        conflict: false,
        reason: "No significant interaction documented between aspirin and cannabis.",
        ai_analysis: "Aspirin and cannabis have minimal direct pharmacological interactions. However, cannabis can increase heart rate and may amplify aspirin's effects.",
        message: "No significant conflict"
    },
    "aspirin_alcohol": {
        found: true,
        medication: "Aspirin",
        brand: "Bayer",
        drug_class: "NSAID",
        substance: "alcohol",
        conflict: true,
        risk: "moderate",
        reason: "Aspirin with alcohol increases risk of gastrointestinal bleeding and ulcers.",
        ai_analysis: "Combining aspirin with alcohol increases the risk of GI bleeding and gastric ulceration. Both substances can thin blood and irritate the stomach lining.",
        message: "Warning - conflict detected"
    },
    "aspirin_both": {
        found: true,
        medication: "Aspirin",
        brand: "Bayer",
        drug_class: "NSAID",
        substance: "both",
        conflict: true,
        risk: "high",
        reason: "Aspirin with alcohol and cannabis significantly increases bleeding and ulcer risk.",
        ai_analysis: "Using aspirin with both alcohol and cannabis substantially increases gastrointestinal bleeding risk and cardiovascular complications.",
        message: "Warning - elevated risk"
    },
    "default_high": {
        found: true,
        medication: "Test Medication",
        brand: "TestBrand",
        drug_class: "Test Class",
        substance: "alcohol",
        conflict: true,
        risk: "moderate",
        reason: "This is a test medication with a moderate risk interaction.",
        ai_analysis: "This is a test AI analysis. In a real scenario, the Gemini API would generate detailed interaction information here.",
        message: "Test payload - moderate risk"
    },
    "default_safe": {
        found: true,
        medication: "Test Medication",
        brand: "TestBrand",
        drug_class: "Test Class",
        substance: "alcohol",
        conflict: false,
        reason: "No significant interaction found.",
        ai_analysis: "This medication appears to have no significant interactions with the selected substance.",
        message: "Test payload - safe"
    }
};

// 🆕 Function to get appropriate mock payload
const getMockMedicationResponse = (medication: string, substance: string): any => {
    const key = `${medication.toLowerCase()}_${substance.toLowerCase()}`;
    if (mockMedicationResponses[key]) {
        return mockMedicationResponses[key];
    }
    // Randomly return high or safe for unknown medications (50/50)
    return Math.random() > 0.5
        ? mockMedicationResponses["default_high"]
        : mockMedicationResponses["default_safe"];
};

// TAB 1 API
export const checkMedicationRisk = async (medication: string, substance: string) => {
    // 🆕 Return mock data if test mode is enabled
    if (TEST_CONFIG.ENABLED) {
        console.log("🧪 TEST MODE: Returning mock medication payload");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(getMockMedicationResponse(medication, substance));
            }, TEST_CONFIG.NETWORK_DELAY_MS); // Simulate network delay
        });
    }

    const fullUrl = `${NGROK_URL}/check-risk`;
    console.log("🚀 Attempting to fetch from:", fullUrl); // Check this in your terminal!

    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                medication,
                substance,
            }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        return await response.json();

    } catch (err: any) {
        console.error("❌ Fetch Error:", err.message);
        throw new Error("Failed to connect to backend. Is ngrok running?");
    }
};

// 🆕 Mock test payloads for vitals risk
const mockVitalsResponses: { [key: string]: any } = {
    "DANGER": {
        risk: "DANGER",
        score: 9,
        risk_score: 9,
        color: "#FF3B30",
        safety_analysis: "CRITICAL: Your vital signs indicate dangerous physiological stress. Respiratory depression detected combined with elevated stress markers. Seek medical attention immediately.",
        status: "CRITICAL: Vital signs show severe respiratory depression and high stress.",
        vitals_confirmed: {
            hr: 145,
            br: 8,
            stress: 92
        }
    },
    "CAUTION": {
        risk: "CAUTION",
        score: 6,
        risk_score: 6,
        color: "#FFCC00",
        safety_analysis: "WARNING: Your vital signs indicate elevated physiological stress. Heart rate is elevated and stress markers are concerning. Monitor closely and reduce substance use.",
        status: "WARNING: Elevated heart rate and stress levels detected.",
        vitals_confirmed: {
            hr: 135,
            br: 14,
            stress: 78
        }
    },
    "STABLE": {
        risk: "STABLE",
        score: 2,
        risk_score: 2,
        color: "#34C759",
        safety_analysis: "Your vital signs appear stable and within normal ranges. Continue monitoring and maintain safe practices.",
        status: "All vital signs are within normal ranges.",
        vitals_confirmed: {
            hr: 72,
            br: 16,
            stress: 35
        }
    }
};

// 🆕 Function to get mock vitals response
const getMockVitalsResponse = (vitals: VitalsData): any => {
    const { heart_rate, breathing_rate, stress_index } = vitals;

    // Determine risk level based on vitals
    if ((stress_index > 80 || heart_rate > 140 || breathing_rate < 10)) {
        return mockVitalsResponses["DANGER"];
    } else if ((heart_rate > 120 || stress_index > 70)) {
        return mockVitalsResponses["CAUTION"];
    }
    return mockVitalsResponses["STABLE"];
};

// TAB 2 API
export const checkVitalsRisk = async (vitals: VitalsData) => {
    // 🆕 Return mock data if test mode is enabled
    if (TEST_CONFIG.ENABLED) {
        console.log("🧪 TEST MODE: Returning mock vitals payload");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(getMockVitalsResponse(vitals));
            }, TEST_CONFIG.NETWORK_DELAY_MS); // Simulate network delay
        });
    }

    const fullUrl = `${NGROK_URL}/check-vitals-risk`;
    console.log("🚀 Syncing Vitals to:", fullUrl);

    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                // 🆕 THIS IS THE KEY: Bypasses the ngrok warning page
                "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify(vitals),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
        }

        return await response.json();

    } catch (err: any) {
        console.error("❌ Vitals Fetch Error:", err.message);
        throw new Error("Failed to connect to backend for vitals check.");
    }
};

// 🆕 Export test mode utilities
export const useTestMode = () => {
    return {
        isEnabled: () => TEST_CONFIG.ENABLED,
        setEnabled: (enabled: boolean) => {
            TEST_CONFIG.ENABLED = enabled;
            console.log(`🧪 Test mode ${enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`);
        },
        toggle: () => {
            TEST_CONFIG.ENABLED = !TEST_CONFIG.ENABLED;
            console.log(`🧪 Test mode toggled to: ${TEST_CONFIG.ENABLED ? 'ON' : 'OFF'}`);
        },
    };
};