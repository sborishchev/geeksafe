import SwiftUI

// This matches your "JSON Contract" exactly
struct SafetyRequest: Codable {
    let substance: String
    let medication: String
    let heart_rate: Int
    let breathing_rate: Int
    let hrv_sdnn: Double
    let stress_index: Int
}

struct MedCheckRequest: Codable {
    //TODO: Update when sergei does
    let medication: str
}

class AppStateManager: ObservableObject {
    @Published var errorMessage: String? = nil

    @Published var latestMedAnalysis: MedResearchResponse? = nil
    @Published var latestVitalAnalysis: VitalScoreResponse? = nil

    @Published var selectedSubstance: String = "Alcohol"
    @Published var scannedMedication: String? = nil
    
    // Vitals from Presage
    @Published var currentBPM: Int = 0
    @Published var currentBR: Int = 0
    @Published var currentHRV: Double = 0.0
    @Published var stressLevel: Int = 0

    @Published var latestAnalysis: AnalysisResponse? = nil
    @Published var isRequesting: Bool = false

    var isEmergencyState: Bool {
        return (latestAnalysis?.riskLevel ?? 0) > 7
    }

    // TODO: Update these as teammates change their local IPs
    let tab1URL = "http://10.200.X.XXX:8000/check-meds" // Placeholder for now
    let tab2URL = "http://10.200.8.188:8000/score-vitals"

    @MainActor
    func runMedicationCheck(name: String) async {
        self.isRequesting = true
        let payload = ["medication": name]
        do {
            // Note we specify the type: MedResearchResponse
            self.latestMedAnalysis = try await APIClient.sendDynamicData(
                fullURL: tab1URL, 
                payload: payload
            )
        }catch {
            print("Research API Error: \(error)")
            self.errorMessage = "Failed to analyze medication. Please try again." // You can use this in your UI to show an alert
        }
        self.isRequesting = false
    }

    // TAB 2: Talk to 'vital_monitor.py'
    @MainActor
    func runVitalCheck() async {
        self.isRequesting = true
        let payload: [String: Any] = [
            "substance": selectedSubstance,
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
        }catch {
            print("Monitor API Error: \(error)")
            self.errorMessage = "Failed to analyze vitals. Please try again." // You can use this in your UI to show an alert
        }
        self.isRequesting = false
    }
}