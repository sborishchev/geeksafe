import { useAppState } from "@/services/AppState";
import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "@/components/successScanHeader";

export default function SafetyScan() {
    const { substance } = useAppState();
    // For now, we use a static status for the header on this tab
    const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'idle'>('idle');

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Header status={scanStatus} />

            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
                    <Text style={styles.title}>Safety Monitor</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Current Substance: <Text style={styles.bold}>{substance.toUpperCase()}</Text>
                        </Text>
                        <Text style={styles.subText}>
                            Ready for face tracking setup.
                        </Text>
                    </View>

                    {/* This is where your Face Tracking Camera will eventually go */}
                    <View style={styles.cameraPlaceholder}>
                        <Text style={styles.placeholderText}>Camera Feed Placeholder</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 34,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 30,
        marginTop: 10
    },
    infoBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 18,
        color: '#333',
    },
    bold: {
        fontWeight: '800',
        color: '#9036DE',
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    cameraPlaceholder: {
        width: '100%',
        height: 400,
        backgroundColor: '#ddd',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#999',
    },
    placeholderText: {
        color: '#666',
        fontWeight: '600',
    }
});