import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '@/services/AppState';

const { width } = Dimensions.get('window');
const BRAND_PURPLE = '#9036DE';

type Substance = 'alcohol' | 'cannabis' | 'both';

function SubstanceIcon({ substance, size = 32 }: { substance: Substance; size?: number }) {
    if (substance === 'cannabis') {
        return <MaterialCommunityIcons name="cannabis" size={size} color={BRAND_PURPLE} />;
    }
    if (substance === 'alcohol') {
        return <MaterialCommunityIcons name="glass-wine" size={size} color={BRAND_PURPLE} />;
    }
    // both
    return <MaterialCommunityIcons name="flask" size={size} color={BRAND_PURPLE} />;
}

export default function CustomTabBar({ state, navigation }: any) {
    const { substance, setSubstance } = useAppState();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleTabPress = (routeName: string) => {
        navigation.navigate(routeName);
        setMenuOpen(false);
    };

    const selectSubstance = (val: Substance) => {
        setSubstance(val);
        setMenuOpen(false);
    };

    return (
        <View style={styles.fixedWrapper} pointerEvents="box-none">

            {/* 1. Substance Popup */}
            {menuOpen && (
                <View style={styles.popupPositioner}>
                    <View style={styles.whitePopup}>
                        <Pressable onPress={() => selectSubstance('cannabis')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'cannabis' && styles.activeSubstanceText]}>Cannabis</Text>
                        </Pressable>
                        <Pressable onPress={() => selectSubstance('alcohol')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'alcohol' && styles.activeSubstanceText]}>Alcohol</Text>
                        </Pressable>
                        <Pressable onPress={() => selectSubstance('both')} style={styles.menuOption}>
                            <Text style={[styles.menuText, substance === 'both' && styles.activeSubstanceText]}>Both</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* 2. The Main Split Bar */}
            <View style={styles.tabBarContainer}>
                <Pressable
                    onPress={() => handleTabPress('index')}
                    style={[
                        styles.tabSegment,
                        { backgroundColor: state.index === 0 ? BRAND_PURPLE : 'rgba(144, 54, 222, 0.50)' }
                    ]}
                >
                    <Text style={styles.tabLabel}>Scan Medicine</Text>
                </Pressable>

                <Pressable
                    onPress={() => handleTabPress('safety')}
                    style={[
                        styles.tabSegment,
                        { backgroundColor: state.index === 1 ? BRAND_PURPLE : 'rgba(144, 54, 222, 0.50)' }
                    ]}
                >
                    <Text style={styles.tabLabel}>Safety Scan</Text>
                </Pressable>
            </View>

            {/* 3. The Floating Circle */}
            <View style={styles.circlePositioner} pointerEvents="box-none">
                <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.whiteCircle}>
                    <SubstanceIcon substance={substance as Substance} size={30} />
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
        height: 110,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 999,
        overflow: 'visible',
    },
    tabBarContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 62,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    tabSegment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 8 : 0,
    },
    tabLabel: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '400',
    },
    circlePositioner: {
        position: 'absolute',
        top: 18,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1001,
    },
    whiteCircle: {
        width: 60,
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    popupPositioner: {
        position: 'absolute',
        bottom: 80,
        zIndex: 1000,
    },
    whitePopup: {
        backgroundColor: '#FFFFFF',
        width: 184,
        borderRadius: 16,
        paddingVertical: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -2 },
        elevation: 8,
    },
    menuOption: {
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
    },
    menuText: {
        color: BRAND_PURPLE,
        fontSize: 18,
        fontWeight: '400',
    },
    activeSubstanceText: {
        fontWeight: '700',
    },
});
