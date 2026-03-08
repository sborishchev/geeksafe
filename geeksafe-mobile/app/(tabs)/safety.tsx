import { useAppState } from "@/services/AppState";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import Header from "@/components/successScanHeader";
import { checkVitalsRisk } from "@/api/apiService";
import { analyzeFrame, setIntoxicationLevel } from "@/services/presageService";
import RiskOverlay from "@/components/riskOverlay";

const SCAN_INTERVAL_MS = 7000; // 7 seconds between scans

export default function SafetyScan() {
    const { setActiveTab, substance } = useAppState();
    const isFocused = useIsFocused();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'idle'>('idle');
    const [apiResult, setApiResult] = useState<any>(null);
    const [scanCount, setScanCount] = useState(0);

    const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isScanningRef = useRef(false);

    // Set active tab when this screen mounts
    useEffect(() => {
        setActiveTab('safety');
    }, [setActiveTab]);

    // Map substance selection to the payload format
    const getSubstanceList = useCallback((): string[] => {
        return substance === 'both' ? ['alcohol', 'weed'] : [substance];
    }, [substance]);

    // Core scan function — called by the interval loop
    const performScan = useCallback(async () => {
        // Guard: don't overlap scans or scan if overlay is showing
        if (isScanningRef.current) return;
        isScanningRef.current = true;

        setScanStatus('scanning');

        // Activate intoxication simulation based on substance
        setIntoxicationLevel(substance !== 'alcohol'); // Shift vitals for cannabis/both

        // Get vitals from Presage rPPG simulation
        const vitals = analyzeFrame();

        const payload = {
            substance: getSubstanceList(),
            medication: "None",
            heart_rate: vitals.heart_rate,
            breathing_rate: vitals.breathing_rate,
            hrv_sdnn: vitals.hrv_sdnn,
            stress_index: vitals.stress_index,
        };

        console.log("🔬 Presage Vitals:", vitals);
        console.log("📡 Sending payload:", JSON.stringify(payload));

        try {
            const data = await checkVitalsRisk(payload);
            console.log("✅ Backend response:", data);
            setApiResult(data);
            setScanStatus('success');
            setScanCount((c) => c + 1);
            // Stop the loop — overlay is now showing
            stopScanLoopRef.current();
        } catch (error) {
            console.error("❌ Scan failed:", error);
            setScanStatus('idle');
        } finally {
            isScanningRef.current = false;
        }
    }, [substance, getSubstanceList]);

    // Start the auto-scan loop
    const startScanLoop = useCallback(() => {
        if (scanTimerRef.current) return; // Already running

        // Perform first scan immediately
        performScan();

        // Then repeat every SCAN_INTERVAL_MS
        scanTimerRef.current = setInterval(() => {
            performScan();
        }, SCAN_INTERVAL_MS);
    }, [performScan]);

    // Stop the auto-scan loop
    const stopScanLoop = useCallback(() => {
        if (scanTimerRef.current) {
            clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
        }
    }, []);

    // Store stopScanLoop in a ref so performScan can use it without circular deps
    const stopScanLoopRef = useRef(stopScanLoop);
    stopScanLoopRef.current = stopScanLoop;

    // Start/stop scanning based on tab focus and permission
    useEffect(() => {
        if (isFocused && permission?.granted && !apiResult) {
            // Small delay to let the camera warm up
            const startDelay = setTimeout(() => {
                startScanLoop();
            }, 2000);
            return () => {
                clearTimeout(startDelay);
                stopScanLoop();
            };
        } else {
            stopScanLoop();
        }
    }, [isFocused, permission?.granted, apiResult, startScanLoop, stopScanLoop]);

    // Clean up on unmount
    useEffect(() => {
        return () => stopScanLoop();
    }, [stopScanLoop]);

    // Handle "Back to Scan" from overlay — reset and restart
    const handleOverlayClose = useCallback(() => {
        setApiResult(null);
        setScanStatus('idle');
        // The useEffect watching apiResult will restart the loop
    }, []);

    // --- Permission not yet determined ---
    if (!permission) {
        return (
            <View style={styles.permissionContainer}>
                <ActivityIndicator size="large" color="#9036DE" />
                <Text style={styles.permissionText}>Loading camera...</Text>
            </View>
        );
    }

    // --- Permission denied ---
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>📸 Camera Required</Text>
                <Text style={styles.permissionText}>
                    GeekSafe uses your camera to monitor vital signs through facial scanning (rPPG).
                </Text>
                <Pressable style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                </Pressable>
            </View>
        );
    }

    // --- Main screen with camera ---
    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Camera layer — fills the entire screen behind the UI */}
            {isFocused && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="front"
                />
            )}

            {/* Dark overlay for readability */}
            <View style={styles.cameraOverlay} />

            {/* Header */}
            <Header status={scanStatus} />

            {/* UI content over the camera */}
            <SafeAreaView style={styles.container}>
                <View style={styles.contentArea}>
                    <Text style={styles.title}>Safety Monitor</Text>

                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <View style={[
                                styles.statusDot,
                                scanStatus === 'scanning' && styles.statusDotActive,
                                scanStatus === 'success' && styles.statusDotSuccess,
                            ]} />
                            <Text style={styles.statusLabel}>
                                {scanStatus === 'scanning'
                                    ? "Analyzing vitals..."
                                    : scanStatus === 'success'
                                        ? "Analysis complete"
                                        : "Preparing scan..."}
                            </Text>
                        </View>

                        {scanStatus === 'scanning' && (
                            <ActivityIndicator color="#9036DE" style={{ marginTop: 12 }} />
                        )}

                        <Text style={styles.statusSubtext}>
                            {scanCount > 0
                                ? `${scanCount} scan${scanCount > 1 ? 's' : ''} completed`
                                : "Face the camera for vital sign detection"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Substance:</Text>
                        <Text style={styles.infoValue}>
                            {substance === 'both' ? 'Alcohol + Cannabis' : substance.charAt(0).toUpperCase() + substance.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Scan Interval:</Text>
                        <Text style={styles.infoValue}>{SCAN_INTERVAL_MS / 1000}s</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Risk Overlay — appears when API result arrives */}
            <RiskOverlay
                result={apiResult}
                onClose={handleOverlayClose}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 100,
    },
    title: {
        fontSize: 34,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 30,
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 1,
    },
    statusCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        zIndex: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#666',
        marginRight: 10,
    },
    statusDotActive: {
        backgroundColor: '#FFCC00',
    },
    statusDotSuccess: {
        backgroundColor: '#34C759',
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    statusSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        zIndex: 2,
    },
    infoLabel: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        color: 'white',
        fontWeight: '700',
    },
    // Permission screens
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 40,
    },
    permissionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#222',
        marginBottom: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#9036DE',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});