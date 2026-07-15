import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

/**
 * Reno mobile prototype (Expo SDK 52, single file).
 * Point API_URL at a running Reno web server. On a physical device, use
 * your computer's LAN IP instead of localhost.
 */
const API_URL = "http://localhost:3000";

// Mirrors packages/core styles/rooms (kept inline so this file stands alone).
const ROOMS = [
  "living room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining room",
  "home office",
  "kids room",
  "backyard/patio",
  "garage",
  "basement",
];

const STYLES: Array<{ id: string; name: string }> = [
  { id: "modern-minimal", name: "Modern Minimal" },
  { id: "scandinavian", name: "Scandinavian" },
  { id: "japandi", name: "Japandi" },
  { id: "industrial", name: "Industrial" },
  { id: "mid-century", name: "Mid-Century" },
  { id: "bohemian", name: "Bohemian" },
  { id: "coastal", name: "Coastal" },
  { id: "luxury", name: "Luxury" },
  { id: "farmhouse", name: "Farmhouse" },
  { id: "cyberpunk", name: "Cyberpunk" },
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [room, setRoom] = useState(ROOMS[0]);
  const [styleId, setStyleId] = useState(STYLES[0].id);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);

  const toDataUrl = (asset: ImagePicker.ImagePickerAsset): string | null => {
    if (!asset.base64) return null;
    const mime = asset.mimeType ?? "image/jpeg";
    return `data:${mime};base64,${asset.base64}`;
  };

  const pick = async (fromCamera: boolean) => {
    setError(null);
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Reno needs access to pick a photo.");
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      base64: true,
      quality: 0.7,
    };
    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;
    const dataUrl = toDataUrl(picked.assets[0]);
    if (!dataUrl) {
      setError("Could not read that photo. Try another one.");
      return;
    }
    setImage(dataUrl);
    setResult(null);
    setShowBefore(false);
  };

  const generate = async () => {
    if (!image) {
      setError("Pick or take a photo first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          style: styleId,
          room,
          mode: "restyle",
          provider: "gemini",
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { image?: string; error?: string };
      if (!res.ok || !data.image) {
        setError(data.error ?? "Generation failed. Is the Reno server running?");
        return;
      }
      setResult(data.image);
      setShowBefore(false);
    } catch {
      setError(`Could not reach ${API_URL}. Start the web app with "npm run dev".`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.logo}>
          Re<Text style={styles.logoAccent}>no</Text>
        </Text>
        <Text style={styles.tagline}>
          Photograph a space. See it redesigned.
        </Text>

        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={() => pick(true)}>
            <Text style={styles.btnText}>Camera</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => pick(false)}>
            <Text style={styles.btnText}>Photo library</Text>
          </Pressable>
        </View>

        {image && !result && (
          <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
        )}

        <Text style={styles.label}>Room</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {ROOMS.map((r) => (
              <Pressable
                key={r}
                style={[styles.chip, room === r && styles.chipActive]}
                onPress={() => setRoom(r)}
              >
                <Text style={[styles.chipText, room === r && styles.chipTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {STYLES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.chip, styleId === s.id && styles.chipActive]}
                onPress={() => setStyleId(s.id)}
              >
                <Text
                  style={[styles.chipText, styleId === s.id && styles.chipTextActive]}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Gemini API key (optional, unlimited renders)</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Paste your key, or use server credits"
          placeholderTextColor="#5c6472"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Pressable
          style={[styles.btn, styles.btnPrimary, (loading || !image) && styles.btnDisabled]}
          onPress={generate}
          disabled={loading || !image}
        >
          {loading ? (
            <ActivityIndicator color="#17100c" />
          ) : (
            <Text style={[styles.btnText, styles.btnPrimaryText]}>
              Generate redesign
            </Text>
          )}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        {result && image && (
          <View style={styles.resultBlock}>
            <Pressable onPress={() => setShowBefore((v) => !v)}>
              <Image
                source={{ uri: showBefore ? image : result }}
                style={styles.preview}
                resizeMode="cover"
              />
              <Text style={styles.resultHint}>
                {showBefore ? "BEFORE — tap to see after" : "AFTER — tap to see before"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115" },
  scroll: { padding: 20, paddingBottom: 48 },
  logo: { color: "#e9ebf1", fontSize: 34, fontWeight: "800", marginTop: 8 },
  logoAccent: { color: "#ff7849" },
  tagline: { color: "#99a1b3", fontSize: 15, marginBottom: 18 },
  row: { flexDirection: "row", gap: 10, marginBottom: 14 },
  btn: {
    borderWidth: 1,
    borderColor: "#39404f",
    backgroundColor: "#151922",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    flexGrow: 1,
  },
  btnPrimary: { backgroundColor: "#ff7849", borderColor: "#ff7849", marginTop: 18 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#e9ebf1", fontWeight: "700", fontSize: 15 },
  btnPrimaryText: { color: "#17100c" },
  label: {
    color: "#99a1b3",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", gap: 8, paddingRight: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#39404f",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: "#ff7849",
    backgroundColor: "rgba(255,120,73,0.14)",
  },
  chipText: { color: "#99a1b3", fontSize: 13 },
  chipTextActive: { color: "#ff7849", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#262c38",
    backgroundColor: "#0b0d11",
    borderRadius: 8,
    color: "#e9ebf1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: "#0b0d11",
    marginTop: 6,
  },
  error: {
    color: "#ff5d6c",
    backgroundColor: "rgba(255,93,108,0.12)",
    borderWidth: 1,
    borderColor: "#ff5d6c",
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    fontSize: 13,
  },
  resultBlock: { marginTop: 18 },
  resultHint: {
    color: "#99a1b3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
});
