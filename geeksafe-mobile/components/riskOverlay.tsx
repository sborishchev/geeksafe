import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useAppState } from '@/services/AppState';

interface RiskOverlayProps {
    result: any; // Can be Med result or Safety result
    onClose: () => void;
}

export default function RiskOverlay({ result, onClose }: RiskOverlayProps) {
    const { activeTab } = useAppState();
    if (!result) return null;

    let title = "";
    let subtitle = "";
    let message = "";
    let extraInfo = "";
    let bgColor = "";

    if (activeTab === 'medication') {
        // 🔴 Red if conflict, 🟢 Green if no conflict
        bgColor = result.conflict ? "#FF3B30" : "#34C759";

        title = result.conflict ? "WARNING MESSAGE" : "STATUS: STABLE";
        subtitle = `${result.medication} + ${result.substance}`;
        message = result.ai_analysis;
        extraInfo = result.reason || `Class: ${result.drug_class}`;
    } else {
        // Safety Tab Logic: score > 7 is Red, else Green
        const riskScore = result.risk_score ?? result.score ?? 0;
        const statusMsg = result.status ?? result.safety_analysis ?? "Analysis complete.";

        bgColor = riskScore > 7 ? "#FF3B30" : "#34C759";

        title = riskScore > 7 ? "WARNING MESSAGE" : "STATUS: STABLE";
        subtitle = `Safety Score: ${riskScore}/10`;
        message = statusMsg;
        extraInfo = `Vitals: HR ${result.vitals_confirmed?.hr} | BR ${result.vitals_confirmed?.br} | Stress ${result.vitals_confirmed?.stress ?? '—'}`;
    }

    return (
        <View style={[styles.fullScreen, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.warningTitle}>{title}</Text>
                    <Text style={styles.subTitle}>{subtitle}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.mainMessage}>{message}</Text>
                    <Text style={styles.extraInfoText}>{extraInfo}</Text>

                    <Pressable style={styles.backButton} onPress={onClose}>
                        {/* Using a dynamic color for the text so it's readable against red/green */}
                        <Text style={[styles.backButtonText, { color: bgColor }]}>
                            Back to Scan
                        </Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: { position: 'absolute', zIndex: 1000, top: 0, left: 0, right: 0, bottom: 0 },
    container: { flex: 1 },
    scrollContent: { padding: 30, alignItems: 'center', justifyContent: 'center', minHeight: '100%' },
    warningTitle: { fontSize: 32, fontWeight: '900', color: 'white', textAlign: 'center', textTransform: 'uppercase' },
    subTitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 10, textAlign: 'center' },
    divider: { width: 50, height: 4, backgroundColor: 'white', marginVertical: 30, opacity: 0.5 },
    mainMessage: { fontSize: 20, color: 'white', textAlign: 'center', lineHeight: 28, fontWeight: '500' },
    extraInfoText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 20, fontStyle: 'italic', textAlign: 'center' },
    backButton: { backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 40, marginTop: 50, elevation: 5 },
    backButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});