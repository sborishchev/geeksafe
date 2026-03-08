// src/api/apiService.ts

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

// TAB 1 API
export const checkMedicationRisk = async (medication: string, substance: string) => {
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

//TAB 2 API
export const checkVitalsRisk = async (vitals: VitalsData) => {
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