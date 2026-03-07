import Foundation

// This is the "Container" for whatever the Python backend spits out
struct AnalysisResponse: Codable {
    var id = UUID()
    let status: String
    let message: String
    let riskLevel: Int // e.g., 1-10
    let details: [String]? // Optional, in case they don't send details

    // TODO: Teammates must use these exact keys in their Python dictionary:
    // "status", "message", "riskLevel"
}