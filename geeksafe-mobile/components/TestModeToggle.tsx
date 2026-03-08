// geeksafe-mobile/components/TestModeToggle.tsx
// 🆕 Optional debug component for easy test mode toggling
// Add this to your app's settings/debug screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTestMode } from '@/api/apiService';

export default function TestModeToggle() {
    const testMode = useTestMode();
    const [isEnabled, setIsEnabled] = useState(testMode.isEnabled());

    const handleToggle = useCallback(() => {
        testMode.toggle();
        setIsEnabled(!isEnabled);
    }, [isEnabled]);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>🧪 Test Mode</Text>
                    <Text style={[styles.badge, isEnabled ? styles.badgeEnabled : styles.badgeDisabled]}>
                        {isEnabled ? 'ON' : 'OFF'}
                    </Text>
                </View>

                <Text style={styles.description}>
                    {isEnabled
                        ? 'Using mock payloads. No network calls required.'
                        : 'Using real backend (set up ngrok or mock will auto-trigger on failure)'}
                </Text>

                <Pressable
                    style={[styles.button, isEnabled ? styles.buttonDisable : styles.buttonEnable]}
                    onPress={handleToggle}
                >
                    <Text style={styles.buttonText}>
                        {isEnabled ? '✅ Disable Test Mode' : '⚫ Enable Test Mode'}
                    </Text>
                </Pressable>

                {isEnabled && (
                    <View style={styles.testInfo}>
                        <Text style={styles.testInfoTitle}>Available Test Medications:</Text>
                        <Text style={styles.testInfoText}>• ibuprofen, xanax, acetaminophen, aspirin</Text>
                        <Text style={styles.testInfoText}>• Any other medication (50/50 random risk)</Text>
                        <Text style={[styles.testInfoTitle, { marginTop: 12 }]}>Test Vitals:</Text>
                        <Text style={styles.testInfoText}>• Generates random vitals automatically</Text>
                        <Text style={styles.testInfoText}>• Risk levels: STABLE, CAUTION, DANGER</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    badgeEnabled: {
        backgroundColor: '#34C759',
    },
    badgeDisabled: {
        backgroundColor: '#8E8E93',
    },
    description: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
        lineHeight: 18,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonEnable: {
        backgroundColor: '#9036DE',
    },
    buttonDisable: {
        backgroundColor: '#FF9500',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    testInfo: {
        backgroundColor: '#f0f0f0',
        borderLeftWidth: 3,
        borderLeftColor: '#9036DE',
        padding: 12,
        borderRadius: 6,
    },
    testInfoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    testInfoText: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
});
