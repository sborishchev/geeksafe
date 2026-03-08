// src/api/apiService.ts

// 🟢 STEP 1: Ensure NO trailing slash here
const NGROK_URL = "https://alexa-unfoaming-terrell.ngrok-free.dev";

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