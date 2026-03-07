import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView } from "react-native";

export default function Index() {
  const [medication, setMedication] = useState("");
  const [substance, setSubstance] = useState("alcohol");
  const [result, setResult] = useState("No result yet");

  // 🔴 CHANGE THIS
  const API_URL = "https://obeyingly-apologal-austin.ngrok-free.dev/check-risk";

  async function checkRisk() {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          medication,
          substance
        })
      });

      const data = await response.json();

      if (data.conflict) {
        setResult(
          `⚠️ Conflict Found\n\nMedication: ${data.medication}\nBrand: ${data.brand}\nRisk: ${data.risk}\nReason: ${data.reason}`
        );
      } else if (data.message) {
        setResult(data.message);
      } else {
        setResult("No conflict found");
      }

    } catch (err: any) {
      setResult("Error: " + err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>GeekSafe</Text>

      <TextInput
        style={styles.input}
        placeholder="Medication or brand"
        value={medication}
        onChangeText={setMedication}
      />

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, substance === "alcohol" && styles.active]}
          onPress={() => setSubstance("alcohol")}
        >
          <Text style={styles.toggleText}>Alcohol</Text>
        </Pressable>

        <Pressable
          style={[styles.toggle, substance === "cannabis" && styles.active]}
          onPress={() => setSubstance("cannabis")}
        >
          <Text style={styles.toggleText}>Cannabis</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={checkRisk}>
        <Text style={styles.buttonText}>Check Risk</Text>
      </Pressable>

      <View style={styles.resultBox}>
        <Text>{result}</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    backgroundColor: "#f5f5f5"
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30
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
    minHeight: 120
  }
});