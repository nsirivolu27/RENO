import { ROOMS, STYLES } from "@reno/core";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const API_URL = "http://localhost:3000";

type GenerateResult = {
  image: string;
  provider: string;
  model: string;
};

export default function App() {
  const [image, setImage] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [room, setRoom] = useState("living room");
  const [style, setStyle] = useState("modern-minimal");
  const [apiKey, setApiKey] = useState("");
  const [showAfter, setShowAfter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pick(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo permission is required.");
      return;
    }

    const picker =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.86 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.86, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!picker.canceled && picker.assets[0]?.base64) {
      const asset = picker.assets[0];
      setImage(`data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`);
      setResult(null);
      setError("");
    }
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image,
          room,
          style,
          mode: "restyle",
          provider: "gemini",
          apiKey: apiKey.trim() || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }
      setResult(data.result);
      setShowAfter(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  const preview = showAfter && result ? result.image : image;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <Text style={styles.title}>Re<Text style={styles.titleAccent}>no</Text></Text>
      <Text style={styles.subtitle}>AI room redesigns with your Gemini key or hosted web credits.</Text>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => void pick("camera")}><Text style={styles.buttonText}>Camera</Text></Pressable>
        <Pressable style={styles.button} onPress={() => void pick("library")}><Text style={styles.buttonText}>Library</Text></Pressable>
      </View>

      {preview ? (
        <Pressable onPress={() => setShowAfter((value) => !value)}>
          <Image source={{ uri: preview }} style={styles.preview} />
          {result ? <Text style={styles.toggle}>{showAfter ? "After" : "Before"}</Text> : null}
        </Pressable>
      ) : (
        <View style={styles.empty}><Text style={styles.muted}>Pick a room photo.</Text></View>
      )}

      <Text style={styles.label}>Room</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {ROOMS.map((entry) => (
          <Chip key={entry} label={entry} active={room === entry} onPress={() => setRoom(entry)} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Style</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {STYLES.map((entry) => (
          <Chip key={entry.id} label={entry.name} active={style === entry.id} onPress={() => setStyle(entry.id)} />
        ))}
      </ScrollView>

      <TextInput
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry
        placeholder="Optional Gemini API key"
        placeholderTextColor="#8c98aa"
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.primary, (!image || loading) && styles.disabled]} disabled={!image || loading} onPress={() => void generate()}>
        {loading ? <ActivityIndicator color="#07110d" /> : <Text style={styles.primaryText}>Generate</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090b0f" },
  content: { padding: 20, gap: 14 },
  title: { color: "#f5f7fb", fontSize: 36, fontWeight: "900" },
  titleAccent: { color: "#56d6a6" },
  subtitle: { color: "#9aa7bb", fontSize: 16, lineHeight: 24 },
  row: { flexDirection: "row", gap: 10 },
  button: { flex: 1, backgroundColor: "#171e29", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#f5f7fb", fontWeight: "800" },
  preview: { width: "100%", aspectRatio: 1, borderRadius: 8, backgroundColor: "#121720" },
  toggle: { color: "#56d6a6", fontWeight: "800", marginTop: 8 },
  empty: { height: 280, borderRadius: 8, backgroundColor: "#121720", alignItems: "center", justifyContent: "center" },
  muted: { color: "#9aa7bb" },
  label: { color: "#f5f7fb", fontWeight: "800", marginTop: 6 },
  chip: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 8, backgroundColor: "#171e29", marginRight: 8 },
  chipActive: { backgroundColor: "#56d6a6" },
  chipText: { color: "#f5f7fb", fontWeight: "700" },
  chipTextActive: { color: "#07110d" },
  input: { color: "#f5f7fb", backgroundColor: "#0c1017", borderColor: "#263143", borderWidth: 1, borderRadius: 8, padding: 13 },
  error: { color: "#ff6b7a" },
  primary: { backgroundColor: "#56d6a6", borderRadius: 8, padding: 16, alignItems: "center" },
  primaryText: { color: "#07110d", fontWeight: "900" },
  disabled: { opacity: 0.55 }
});
