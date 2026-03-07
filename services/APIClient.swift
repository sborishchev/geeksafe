import Foundation

enum NetworkError: Error {
    case badURL, requestFailed, decodingError
}

struct APIClient {
    // TODO: When teammates give their URL (Ngrok or Heroku), 
    // you only have to change it once right here.
    static let baseURL = "http://localhost:8000" 

    static func sendDynamicData(endpoint: String, payload: [String: Any]) async throws -> AnalysisResponse {
        guard let url = URL(string: baseURL + endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Convert Dictionary to JSON Data
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        return try JSONDecoder().decode(AnalysisResponse.self, from: data)
    }
}