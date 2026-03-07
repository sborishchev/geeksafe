import Foundation

// --- MODEL 1: For the Medication Research (Tab 1) ---
struct MedResearchResponse: Codable, Identifiable {
    var id = UUID()
    let found: Bool
    let medication: String?
    let brand: String?
    let drug_class: String?
    let conflict: Bool?
    let risk: String?     // "High", "Medium", "Low"
    let reason: String?   // The human-readable reason
    let ai_analysis: String?
    
    // CodingKeys helps Swift ignore the 'id' when decoding from JSON
    enum CodingKeys: String, CodingKey {
        case found, medication, brand, drug_class, conflict, risk, reason, ai_analysis
    }
}

// --- MODEL 2: For the Vital Scoring (Tab 2) ---
struct VitalScoreResponse: Codable, Identifiable {
    var id = UUID()
    let status: String       // e.g., "Dangerous"
    let risk_score: Int      // e.g., 8
    let recommendation: String
    
    enum CodingKeys: String, CodingKey {
        case status, risk_score, recommendation
    }
}