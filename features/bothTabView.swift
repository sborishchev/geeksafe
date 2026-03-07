import SwiftUI

struct bothTabView: View {
    @EnvironmentObject var stateManager: AppStateManager
    
    var body: some View {
        VStack(spacing: 0) {
            // 1. THE TOGGLE UI
            Picker("Substance", selection: $stateManager.selectedSubstance) {
                Text("Alcohol").tag("Alcohol")
                Text("Weed").tag("Weed")
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            .background(Color(.systemBackground))
            
            TabView {
                // Tab 1: Med Scanner
                MedScannerView()
                    .tabItem {
                        Label("Med Scan", systemImage: "pills.fill")
                    }
                
                // Tab 2: Safety Mirror
                SafetyMirrorView()
                    .tabItem {
                        Label("Safety Mirror", systemImage: "face.dashed.fill")
                    }
            }
        }
        // Emergency styling remains
        .accentColor(stateManager.isEmergencyState ? .red : .blue)
        .sheet(item: $stateManager.latestAnalysis) { report in
            ConflictReportView(response: report)
        }
    }
}