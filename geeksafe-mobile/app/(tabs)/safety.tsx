import { useAppState } from "@/services/AppState";
import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, ActivityIndicator } from "react-native";
import Header from "@/components/successScanHeader";
import { checkVitalsRisk } from "@/api/apiService";

export default function SafetyScan() {
    const { substance } = useAppState();
    const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'idle'>('idle');
    const [apiResult, setApiResult] = useState<any>(null);

    const runTestScan = async () => {
        setScanStatus('scanning');
        setApiResult(null);

        // 1. Map state to Backend List[str]
        let substanceList: string[] = [];
        if (substance === 'both') {
            substanceList = ['alcohol', 'weed'];
        } else {
            substanceList = [substance];
        }

        // 2. Placeholder vitals (DANGER trigger: breathing < 13 on multiple substances)
        const testPayload = {
            substance: substanceList,
            medication: "None",
            heart_rate: 110,
            breathing_rate: 11, // This should trigger the "DANGER" logic
            hrv_sdnn: 25.0,
            stress_index: 85
        };

        try {
            const data = await checkVitalsRisk(testPayload);
            setApiResult(data);
            setScanStatus('success');
        } catch (error) {
            console.error(error);
            setScanStatus('idle');
            alert("Backend test failed. Check your terminal/ngrok.");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Header status={scanStatus} />

            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
                    <Text style={styles.title}>Safety Monitor</Text>

                    {/* Test Button */}
                    <Pressable
                        style={[styles.testButton, scanStatus === 'scanning' && { opacity: 0.6 }]}
                        onPress={runTestScan}
                        disabled={scanStatus === 'scanning'}
                    >
                        <Text style={styles.buttonText}>
                            {scanStatus === 'scanning' ? "Analysing Vitals..." : "Simulate Safety Check"}
                        </Text>
                    </Pressable>

                    {/* Display Result if exists */}
                    {apiResult && (
                        <View style={[styles.resultCard, { borderColor: apiResult.color || '#9036DE' }]}>
                            <Text style={[styles.riskTitle, { color: apiResult.color }]}>
                                {apiResult.risk} (Score: {apiResult.score}/10)
                            </Text>
                            <Text style={styles.analysisText}>{apiResult.safety_analysis}</Text>
                        </View>
                    )}

                    <View style={styles.cameraPlaceholder}>
                        <Text style={styles.placeholderText}>
                            {scanStatus === 'scanning' ? "Scanning Face..." : "Camera Feed Placeholder"}
                        </Text>
                        {scanStatus === 'scanning' && <ActivityIndicator color="#9036DE" style={{ marginTop: 10 }} />}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 30 },
    title: { fontSize: 34, fontWeight: "700", textAlign: "center", marginBottom: 30, marginTop: 10 },
    testButton: {
        backgroundColor: '#9036DE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center'
    },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    resultCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 20,
    },
    riskTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    analysisText: { fontSize: 15, lineHeight: 22, color: '#444' },
    cameraPlaceholder: {
        width: '100%',
        height: 300,
        backgroundColor: '#ddd',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#999',
    },
    placeholderText: { color: '#666', fontWeight: '600' }
});