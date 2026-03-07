import Foundation

struct APIClient {
    // We remove the static baseURL so we can point to different servers per tab
    static func sendDynamicData(fullURL: String, payload: [String: Any]) async throws -> AnalysisResponse {
        guard let url = URL(string: fullURL) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Convert Dictionary to JSON Data
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            // This will trigger if the teammate's server is down or the IP changed
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(AnalysisResponse.self, from: data)
    }
}