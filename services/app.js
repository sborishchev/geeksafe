import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity } from "react-native";

export default function App() {
  const [medication, setMedication] = useState("");
  const [substance, setSubstance] = useState("alcohol");
  const [result, setResult] = useState("No result yet");

  const API_URL = "https://YOUR-NGROK-URL.ngrok-free.app/check-risk";

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
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult("Error: " + err.message);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, marginBottom: 20 }}>GeekSafe</Text>

      <TextInput
        placeholder="Medication or brand"
        value={medication}
        onChangeText={setMedication}
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 12,
          borderRadius: 8
        }}
      />

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setSubstance("alcohol")}
          style={{
            padding: 12,
            backgroundColor: substance === "alcohol" ? "black" : "#ddd",
            marginRight: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: substance === "alcohol" ? "white" : "black" }}>
            Alcohol
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSubstance("cannabis")}
          style={{
            padding: 12,
            backgroundColor: substance === "cannabis" ? "black" : "#ddd",
            borderRadius: 8
          }}
        >
          <Text style={{ color: substance === "cannabis" ? "white" : "black" }}>
            Cannabis
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={checkRisk}
        style={{
          backgroundColor: "blue",
          padding: 14,
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Check Risk</Text>
      </TouchableOpacity>

      <Text>{result}</Text>
    </SafeAreaView>
  );
}