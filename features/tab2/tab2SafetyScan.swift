import SwiftUI
// TODO: ON MAC - Import the Presage Framework
// import SmartSpectraSwiftSDK

struct SafetyMirrorView: View {
    @EnvironmentObject var stateManager: AppStateManager
    
    var body: some View {
        ZStack {
            // 1. THE "REALLY BAD" WARNING UI (From your diagram)
            // This fills the background red if the RiskLevel is high
            if stateManager.isEmergencyState {
                Color.red.opacity(0.3).ignoresSafeArea()
            }

            VStack(spacing: 20) {
                Text("Safety Mirror")
                    .font(.largeTitle).bold()

                // 2. CAMERA FEED PLACEHOLDER
                // This is where the Presage SDK will render the face scan
                ZStack {
                    RoundedRectangle(cornerRadius: 25)
                        .fill(Color.black)
                        .frame(height: 350)
                    
                    VStack {
                        Image(systemName: "faceid")
                            .font(.system(size: 50))
                            .foregroundColor(.white.opacity(0.5))
                        Text("Presage Active")
                            .foregroundColor(.white.opacity(0.5))
                    }
                    
                    // Overlay the Waveform you built earlier!
                    VStack {
                        Spacer()
                        WaveformView(color: stateManager.isEmergencyState ? .white : .blue)
                            .frame(height: 80)
                            .padding(.bottom, 20)
                    }
                }
                .padding()

                // 3. STATISTICS DISPLAY (From your diagram)
                HStack(spacing: 20) {
                    VitalStatBox(label: "BPM", value: "\(stateManager.currentBPM)", icon: "heart.fill", color: .red)
                    VitalStatBox(label: "Breathing", value: "\(stateManager.currentBR)", icon: "wind", color: .blue)
                }
                .padding(.horizontal)

                // 4. ACTION BUTTON: "Send Presage Stats"
                Button(action: {
                    Task {
                        // Simulate picking up Presage data and sending to Blackbox
                        stateManager.currentBPM = Int.random(in: 100...140)
                        stateManager.currentBR = Int.random(in: 8...12)
                        await stateManager.processVitals(medication: nil)
                    }
                }) {
                    Text(stateManager.isRequesting ? "Analyzing..." : "Run Safety Check")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(stateManager.isEmergencyState ? Color.red : Color.blue)
                        .cornerRadius(15)
                }
                .padding()
                .disabled(stateManager.isRequesting)

                Spacer()
            }
        }
    }
}

// Reusable component for the Vitals
struct VitalStatBox: View {
    let label: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack {
            HStack {
                Image(systemName: icon).foregroundColor(color)
                Text(label).font(.caption).bold()
            }
            Text(value).font(.title).bold()
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(15)
    }
}