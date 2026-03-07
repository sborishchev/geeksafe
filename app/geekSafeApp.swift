import SwiftUI
// import SmartSpectraSwiftSDK // Uncomment when you move to Mac

@main
struct GeekSafeApp: App {
    // We initialize the manager here so it lives as long as the app does
    @StateObject private var stateManager = AppStateManager()
    
    init() {
        // Safe retrieval of the Presage API Key from your .xcconfig via Info.plist
        if let key = Bundle.main.infoDictionary?["PRESAGE_API_KEY"] as? String {
            // TODO: uncomment this when move to XCode: SmartSpectraSwiftSDK.shared.setApiKey(key)
            print("🛡️ GeekSafe: Presage SDK Initialized with Key.")
        } else {
            print("⚠️ GeekSafe: Running without API Key (Check Secrets.xcconfig).")
        }
    }

    var body: some Scene {
        WindowGroup {
            bothTabView()
                .environmentObject(stateManager) // Injects the manager into all views
        }
    }
}