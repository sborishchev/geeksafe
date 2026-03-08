import { useAppState } from "@/services/AppState";
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { checkMedicationRisk } from "@/api/apiService";
import Header from "@/components/successScanHeader";
import RiskOverlay from "@/components/riskOverlay"; // 👈 1. Import the Overlay
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const { setActiveTab } = useAppState();

  // 👈 2. FIX: Change 'safety' to 'medication'
  useEffect(() => {
    setActiveTab('medication');
  }, []);

  const [medication, setMedication] = useState("");
  const { substance, setSubstance } = useAppState();

  // 👈 3. Update state to store the full object for the Overlay
  const [apiResult, setApiResult] = useState<any>(null);
  const [result, setResult] = useState("No result yet");
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'idle'>('idle');

  // Camera state
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const startScanning = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        alert("Camera permission is required to scan labels.");
        return;
      }
    }
    setIsScanningMode(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setIsExtracting(true);
    try {
      // 🆕 Capture image and immediately check Aspirin
      await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });

      console.log("📸 Captured: Aspirin - checking risk now");

      // Directly call risk check without setting medication field
      setScanStatus('scanning');
      setApiResult(null);

      const data = await checkMedicationRisk("Aspirin", substance);
      console.log("Full Backend Response:", data);

      setScanStatus('success');
      setApiResult(data);

      if (data.conflict === true || data.risk_level === 'high') {
        setResult(`⚠️ DANGER: ${data.reason}`);
      } else {
        setResult(data.message || "No conflict found");
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setScanStatus('idle');
      setResult("Error: " + (err as any).message);
    } finally {
      setIsExtracting(false);
      setIsScanningMode(false);
    }
  };

  async function handleCheck() {
    setScanStatus('scanning');
    setApiResult(null); // Clear previous results

    try {
      const data = await checkMedicationRisk(medication, substance);
      console.log("Full Backend Response:", data);

      setScanStatus('success');
      setApiResult(data); // 👈 4. Store the object for the Overlay to use

      if (data.conflict === true || data.risk_level === 'high') {
        setResult(`⚠️ DANGER: ${data.reason}`);
      } else {
        setResult(data.message || "No conflict found");
      }
    } catch (err: any) {
      setScanStatus('idle');
      setResult("Error: " + err.message);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Header status={scanStatus} />

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
          <Text style={styles.title}>GeekSafe</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Scan or type medication..."
              value={medication}
              onChangeText={setMedication}
            />
            <Pressable style={styles.scanIconButton} onPress={startScanning}>
              <Ionicons name="scan" size={24} color="#2563eb" />
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            {['alcohol', 'cannabis', 'both'].map((s) => (
              <Pressable
                key={s}
                style={[styles.toggle, substance === s && styles.active]}
                onPress={() => setSubstance(s as any)}
              >
                <Text style={styles.toggleText}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.button} onPress={handleCheck}>
            <Text style={styles.buttonText}>Check Risk</Text>
          </Pressable>

          <View style={styles.resultBox}>
            <Text>{result}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* 👈 5. Add Overlay here - it will cover the screen when apiResult is set */}
      <RiskOverlay
        result={apiResult}
        onClose={() => {
          setApiResult(null);
          setScanStatus('idle');
        }}
      />

      {/* Camera Scanning Overlay */}
      {isScanningMode && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <SafeAreaView style={styles.cameraControlsContainer}>
              <View style={styles.cameraHeader}>
                <Pressable onPress={() => setIsScanningMode(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={32} color="white" />
                </Pressable>
              </View>

              <View style={styles.cameraFooter}>
                <Text style={styles.cameraInstruction}>
                  Tap to scan
                </Text>
                {isExtracting ? (
                  <View style={styles.captureButtonLoading}>
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                ) : (
                  <Pressable onPress={takePicture} style={styles.captureButton}>
                    <View style={styles.captureButtonInner} />
                  </Pressable>
                )}
              </View>
            </SafeAreaView>
          </CameraView>
        </View>
      )}
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "white",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  toggle: {
    flex: 1,
    padding: 14,
    backgroundColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5
  },
  active: {
    backgroundColor: "#2563eb"
  },
  toggleText: {
    color: "white",
    fontWeight: "600"
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  resultBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    minHeight: 120,
    marginBottom: 100
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanIconButton: {
    padding: 14,
    marginLeft: 8,
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 100,
  },
  camera: {
    flex: 1,
  },
  cameraControlsContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    padding: 20,
    alignItems: "flex-end",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  cameraFooter: {
    paddingBottom: 40,
    alignItems: "center",
  },
  cameraInstruction: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden"
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  captureButtonLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  }
});