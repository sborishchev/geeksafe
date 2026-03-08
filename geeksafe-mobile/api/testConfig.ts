// src/api/testConfig.ts
// 🆕 Centralized test configuration

export const TEST_CONFIG = {
    // Set to true to enable test mode (uses mock payloads, no network calls)
    ENABLED: true,

    // Set to true to see verbose logging
    VERBOSE_LOGGING: true,

    // Network delay simulation (ms)
    NETWORK_DELAY_MS: 500,
};

// Toggle test mode with this function
export const setTestMode = (enabled: boolean) => {
    TEST_CONFIG.ENABLED = enabled;
    console.log(`🧪 Test mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
};

// Get current test mode status
export const isTestModeEnabled = (): boolean => {
    return TEST_CONFIG.ENABLED;
};
