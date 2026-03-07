import SwiftUI

// MARK: - Response Models (Matching Python JSON)
struct VitalScoreResponse: Codable {
    let danger_level: String
    let color: String
    let risk_score: Int
    let status: String
    let vitals_confirmed: VitalsConfirmed
}

struct VitalsConfirmed: Codable {
    let hr: Int
    let br: Int
}

struct MedResearchResponse: Codable {
    let found: Bool
    let medication: String?
    let conflict: Bool
    let risk: String?
    let reason: String?
    let ai_analysis: String?
}

// MARK: - App State Manager
class AppStateManager: ObservableObject {
    @Published var errorMessage: String? = nil
    @Published var isRequesting: Bool = false
    
    // Results from API
    @Published var latestMedAnalysis: MedResearchResponse? = nil
    @Published var latestVitalAnalysis: VitalScoreResponse? = nil

    // User Data
    @Published var selectedSubstance: String = "Alcohol"
    @Published var scannedMedication: String? = nil
    
    // Vitals from Presage SDK
    @Published var currentBPM: Int = 0
    @Published var currentBR: Int = 0
    @Published var currentHRV: Double = 0.0
    @Published var stressLevel: Int = 0

    // Emergency logic based on the new risk_score from Python
    var isEmergencyState: Bool {
        return (latestVitalAnalysis?.risk_score ?? 0) > 7
    }

    // UPDATE THIS with your Ngrok link!
    let baseURL = "https://your-ngrok-id.ngrok-free.app"
    
    var tab1URL: String { "\(baseURL)/check-alcohol-risk" }
    var tab2URL: String { "\(baseURL)/score-vitals" }

    @MainActor
    func runMedicationCheck(name: String) async {
        self.isRequesting = true
        let payload = ["medication": name]
        do {
            self.latestMedAnalysis = try await APIClient.sendDynamicData(
                fullURL: tab1URL, 
                payload: payload
            )
        } catch {
            print("Research API Error: \(error)")
            self.errorMessage = "Medication check failed."
        }
        self.isRequesting = false
    }

    @MainActor
    func runVitalCheck() async {
        self.isRequesting = true
        let payload: [String: Any] = [
            "substance": selectedSubstance,
            "medication": scannedMedication ?? "None",
            "heart_rate": currentBPM,
            "breathing_rate": currentBR,
            "hrv_sdnn": currentHRV,
            "stress_index": stressLevel
        ]
        
        do {
            self.latestVitalAnalysis = try await APIClient.sendDynamicData(
                fullURL: tab2URL, 
                payload: payload
            )
        } catch {
            print("Monitor API Error: \(error)")
            self.errorMessage = "Vital analysis failed."
        }
        self.isRequesting = false
    }
}