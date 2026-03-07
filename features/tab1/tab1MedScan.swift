import SwiftUI

struct MedScannerView: View {
    @EnvironmentObject var stateManager: AppStateManager
    @State private var showingReport = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // 1. HEADER SELECTION (From your 'Enter App' logic)
                Picker("Substance", selection: $stateManager.selectedSubstance) {
                    Text("Alcohol").tag("Alcohol")
                    Text("Cannabis").tag("Cannabis")
                }
                .pickerStyle(.segmented)
                .padding()

                // 2. SCANNING SECTION
                VStack(spacing: 15) {
                    Image(systemName: "pills.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                    
                    Text("Check for Medication Conflicts")
                        .font(.headline)

                    HStack(spacing: 20) {
                        // Button 1: Scan (Mock for VisionKit)
                        ScannerButton(title: "Scan Label", icon: "camera.fill") {
                            simulateScan(name: "Xanax")
                        }

                        // Button 2: Upload (Mock for PhotosPicker)
                        ScannerButton(title: "Upload Image", icon: "photo.on.rectangle") {
                            simulateScan(name: "Zoloft")
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(20)
                .padding()

                // 3. STATUS / RESULTS AREA
                if stateManager.isRequesting {
                    ProgressView("Consulting Blackbox...")
                } else if let report = stateManager.latestAnalysis {
                    ResultCard(report: report)
                }

                Spacer()
            }
            .navigationTitle("Med Scanner")
        }
    }

    // This simulates the "Create JSON -> Send to Backend" part of your diagram
    func simulateScan(name: String) {
        // TODO: Replace this manual string with VisionKit 'transcript'
        stateManager.scannedIngredients = [name, "Magnesium Stearate"]
        Task {
            await stateManager.processVitals(medication: name)
        }
    }
}

// --- SUB-COMPONENTS ---

struct ScannerButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack {
                Image(systemName: icon)
                    .font(.title2)
                Text(title)
                    .font(.caption).bold()
            }
            .frame(width: 120, height: 80)
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }
}

struct ResultCard: View {
    let report: AnalysisResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Analysis Result")
                    .font(.headline)
                Spacer()
                // Color changes based on the RiskLevel in your BackendModel
                Circle()
                    .fill(report.riskLevel > 7 ? Color.red : Color.green)
                    .frame(width: 12, height: 12)
            }
            
            Text(report.message)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(15)
        .padding(.horizontal)
    }
}