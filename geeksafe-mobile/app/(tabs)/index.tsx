import { useAppState } from "@/services/AppState";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { checkMedicationRisk } from "@/api/apiService";
import Header from "@/components/successScanHeader";
import RiskOverlay from "@/components/riskOverlay"; // 👈 1. Import the Overlay

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

          <TextInput
            style={styles.input}
            placeholder="Scan or type medication..."
            value={medication}
            onChangeText={setMedication}
          />

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
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "white",
    marginBottom: 16
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
  }
});