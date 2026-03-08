import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface HeaderProps {
    status: 'scanning' | 'success' | 'idle';
}

export default function Header({ status }: HeaderProps) {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (status === 'scanning') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Left side spacer to keep pill centered */}
                <View style={styles.sideSpace} />

                {/* Center: Status Pill (Stays Purple) */}
                <View style={styles.statusPill}>
                    <Animated.Text style={[styles.statusText, { opacity: pulseAnim }]}>
                        {status === 'scanning' ? '...' : status === 'success' ? 'Success' : 'Ready'}
                    </Animated.Text>
                </View>

                {/* Right side: Settings Button */}
                <Pressable style={styles.sideSpace}>
                    <View style={styles.settingsCircle}>
                        <MaterialIcons name="settings" size={20} color="#9036DE" />
                    </View>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 50,
        // Pushes the header down to clear the iPhone camera hardware
        marginTop: Platform.OS === 'ios' ? 25 : 35,
    },
    sideSpace: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPill: {
        width: 110, // Slimmed down from 160
        height: 40, // Slimmed down from 50
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#9036DE',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 18, // Reduced from 24
        fontWeight: '600',
        color: '#9036DE',
    },
    settingsCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
});