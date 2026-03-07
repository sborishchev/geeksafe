import SwiftUI

struct ConflictReportView: View {
    // This allows the "Dismiss" button to close the pop-up
    @Environment(\.dismiss) var dismiss
    let response: AnalysisResponse

    var body: some View {
        VStack(spacing: 25) {
            // 1. DRAG HANDLE (Makes it look like a real iOS sheet)
            Capsule()
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 40, height: 6)
                .padding(.top, 10)

            // 2. STATUS HEADER
            VStack(spacing: 10) {
                Image(systemName: response.riskLevel > 7 ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(response.riskLevel > 7 ? .red : .green)
                
                Text(response.status)
                    .font(.title.bold())
            }

            // 3. THE "BLACKBOX" MESSAGE
            ScrollView {
                Text(response.message)
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            // 4. SUMMARY BOX
            VStack(alignment: .leading, spacing: 15) {
                HStack {
                    Text("Risk Score:")
                    Spacer()
                    Text("\(response.riskLevel)/10")
                        .bold()
                        .foregroundColor(response.riskLevel > 7 ? .red : .primary)
                }
                
                // Progress bar for visual impact
                ProgressView(value: Double(response.riskLevel), total: 10)
                    .tint(response.riskLevel > 7 ? .red : .green)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
            .padding(.horizontal)

            // 5. DISMISS BUTTON
            Button(action: { dismiss() }) {
                Text("Understood")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(15)
            }
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
    }
}