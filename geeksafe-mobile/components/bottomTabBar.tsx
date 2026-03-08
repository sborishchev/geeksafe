import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAppState } from '@/services/AppState';

const { width } = Dimensions.get('window');
const BRAND_PURPLE = '#9036DE';

export default function CustomTabBar({ state, navigation }: any) {
    const { substance, setSubstance } = useAppState();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleTabPress = (routeName: string) => {
        navigation.navigate(routeName);
        setMenuOpen(false);
    };

    const selectSubstance = (val: 'alcohol' | 'cannabis' | 'both') => {
        setSubstance(val);
        setMenuOpen(false);
    };

    return (
        <View style={styles.fixedWrapper} pointerEvents="box-none">

            {/* 1. Substance Popup - Positioned to clear the bar */}
            {menuOpen && (
                <View style={styles.popupPositioner}>
                    <View style={styles.whitePopup}>
                        <Text style={styles.arrowUp}>⌄</Text>
                        <Pressable onPress={() => selectSubstance('alcohol')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'alcohol' && styles.activeSubstanceText]}>Alcohol</Text>
                        </Pressable>
                        <Pressable onPress={() => selectSubstance('cannabis')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'cannabis' && styles.activeSubstanceText]}>Cannabis</Text>
                        </Pressable>
                        <Pressable onPress={() => selectSubstance('both')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'both' && styles.activeSubstanceText]}>Both</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* 2. The Main Split Bar with Transparency */}
            <View style={styles.tabBarContainer}>
                <Pressable
                    onPress={() => handleTabPress('index')}
                    style={[
                        styles.tabSegment,
                        { backgroundColor: state.index === 0 ? BRAND_PURPLE : 'rgba(157, 124, 255, 0.4)' }
                    ]}
                >
                    <Text style={styles.tabLabel}>Scan Medicine</Text>
                </Pressable>

                <Pressable
                    onPress={() => handleTabPress('safety')}
                    style={[
                        styles.tabSegment,
                        { backgroundColor: state.index === 1 ? BRAND_PURPLE : 'rgba(157, 124, 255, 0.4)' }
                    ]}
                >
                    <Text style={styles.tabLabel}>Safety Scan</Text>
                </Pressable>
            </View>

            {/* 3. The Floating Circle - No Clipping */}
            <View style={styles.circlePositioner} pointerEvents="box-none">
                <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.whiteCircle}>
                    <Text style={styles.iconText}>
                        {substance === 'cannabis' ? '🌿' : substance === 'both' ? '➕' : '🍺'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fixedWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140, // Height expanded to prevent clipping
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 999,
        overflow: 'visible',
    },
    tabBarContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    tabSegment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    },
    tabLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    circlePositioner: {
        position: 'absolute',
        top: 20, // Adjusted to make circle perfectly centered on the top edge
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1001,
    },
    whiteCircle: {
        width: 66,
        height: 66,
        backgroundColor: '#FFFFFF',
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    iconText: {
        fontSize: 32,
    },
    popupPositioner: {
        position: 'absolute',
        bottom: 105,
        zIndex: 1000,
    },
    whitePopup: {
        backgroundColor: '#FFFFFF',
        width: 150,
        borderRadius: 20,
        paddingBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    arrowUp: {
        color: BRAND_PURPLE,
        fontSize: 24,
        fontWeight: 'bold',
    },
    menuOption: {
        paddingVertical: 10,
    },
    menuText: {
        color: BRAND_PURPLE,
        fontSize: 16,
        fontWeight: '600',
    },
    activeSubstanceText: {
        fontWeight: '900',
        textDecorationLine: 'underline',
    }
});