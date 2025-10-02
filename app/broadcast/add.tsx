// app/broadcast/add.tsx
import { useAuth } from "@/src/AuthContext"; // adjust path if needed
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddBroadcastScreen() {
  const router = useRouter();
  const { admin } = useAuth(); // expects admin.token and admin.id
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("http://api.playpunts.com/admin_api/allUsers"); // replace with your real endpoint
      const data = await res.json();
      // assume data is an array; if nested, adapt accordingly e.g. data.data
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("fetchUsers error:", err);
      Alert.alert("Error", "Unable to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleSelect = (id: number | string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (u.name || u.fullname || "").toString().toLowerCase();
    const username = (u.username || "").toString().toLowerCase();
    return name.includes(q) || username.includes(q);
  });

const submit = async () => {
  if (!groupName.trim()) {
    return Alert.alert("Validation", "Please enter a group name.");
  }
  if (selectedIds.size === 0) {
    return Alert.alert("Validation", "Select at least one user.");
  }

  setSubmitting(true);
  try {
    const payload = {
      group_name: groupName.trim(),
      user_ids: Array.from(selectedIds),
    };

    console.log("Creating broadcast, payload:", payload);

    const res = await fetch("http://api.playpunts.com/admin_api/createGroup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(admin?.token ? { Authorization: `Bearer ${admin.token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    console.log("createBroadcast status:", res.status, "content-type:", contentType);

    // If server returned JSON
    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log("createBroadcast json:", data);

      const okStatus = res.status === 200 || res.status === 201;
      const success = data?.status === "success" || data?.success === true;
      if (okStatus && (success || data?.group)) {
        Alert.alert("Success", data.message || "Group created successfully");
        router.replace("/");
        return;
      } else {
        console.warn("createBroadcast error json:", data);
        Alert.alert("Error", data?.message || "Failed to create group");
        return;
      }
    }

    // If not JSON, read raw text (likely HTML error page)
    const text = await res.text();
    console.error("createBroadcast non-json response:", res.status, text);
    Alert.alert(
      "Server Error",
      `Server did not return JSON. Status ${res.status}. Check server logs.\n\nFirst 500 chars:\n${text.substring(0, 500)}`
    );
  } catch (err) {
    console.error("createBroadcast network/parsing error:", err);
    Alert.alert("Error", "Network or parse error. See Metro logs for details.");
  } finally {
    setSubmitting(false);
  }
};



  const renderItem = ({ item }: { item: any }) => {
    const id = item.id ?? item.user_id ?? item.admin_id;
    const name = item.name ?? item.fullname ?? item.username ?? "Unknown";
    const subtitle = item.username ?? item.email ?? "";

    const initials = (name || "")
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const selected = selectedIds.has(id);

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(id)}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.name}>{name}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.right}>
          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
          ) : (
            <Ionicons name="ellipse-outline" size={22} color="#888" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Broadcast</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          <TextInput
            placeholder="Group name"
            placeholderTextColor="#aaa"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />

          <TextInput
            placeholder="Search users..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={[styles.input, { marginTop: 8 }]}
          />

          <View style={styles.selectedBar}>
            <Text style={styles.selectedText}>
              Selected: {selectedIds.size}
            </Text>
            <TouchableOpacity
              onPress={() => {
                // quick select all / clear toggle
                if (selectedIds.size === users.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(users.map((u) => u.id ?? u.user_id)));
                }
              }}
            >
              <Text style={styles.selectAll}>
                {selectedIds.size === users.length ? "Clear" : "Select all"}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingUsers ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id ?? item.user_id ?? Math.random())}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (!groupName.trim() || selectedIds.size === 0 || submitting) && { opacity: 0.6 }]}
            onPress={submit}
            disabled={!groupName.trim() || selectedIds.size === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    height: 56,
    backgroundColor: "#1F1F1F",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

  inner: { flex: 1, padding: 12 },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  selectedBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  selectedText: { color: "#fff" },
  selectAll: { color: "#007AFF", fontWeight: "600" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B1B1B",
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    justifyContent: "space-between",
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  subtitle: { color: "#aaa", marginTop: 2, fontSize: 12 },
  right: { width: 36, alignItems: "center", justifyContent: "center" },

  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#232323",
    backgroundColor: "#121212",
  },
  submitBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
});
