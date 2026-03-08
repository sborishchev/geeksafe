import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 2000); // 2 seconds exactly

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                {/* Replace with your shield icon from assets later */}
                <View style={styles.logoPlaceholder}>
                    <Text style={{ fontSize: 40 }}>🛡️</Text>
                </View>
                <Text style={styles.title}>GEEKSAFE</Text>
                <Text style={styles.subtitle}>iOS SAFETY COMPANION</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A0B2E', // Deep Figma Purple
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 5,
    },
    subtitle: {
        color: '#BBAAFF',
        fontSize: 12,
        marginTop: 8,
        letterSpacing: 1,
    },
});