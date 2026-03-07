import SwiftUI

struct bothTabView: View {
    @EnvironmentObject var stateManager: AppStateManager
    
    var body: some View {
        // This creates the bottom navigation bar seen in most iOS apps
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
        // This ensures the "Really Bad" red warning 
        // can cover the whole screen if needed
        .accentColor(stateManager.isEmergencyState ? .red : .blue)
        .sheet(item: $stateManager.latestAnalysis) { report in
            ConflictReportView(response: report)
        }
    }
}