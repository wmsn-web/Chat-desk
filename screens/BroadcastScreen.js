import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

//const API_URL = "http://10.0.2.2:3595";
const API_URL = "http://api.playpunts.com";

const router = useRouter();

export default function BroadcastScreen() {
  const [bgroups, setChats] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBgroups();
  }, []);

  const fetchBgroups = async () => {
    try {
      const res = await fetch(`${API_URL}/admin_api/allGroups`); // ⬅️ replace with your API
      const data = await res.json();
      setChats(data.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const filteredUsers = bgroups.filter(
    (bgroup) =>
      bgroup.group_name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const initials = item.group_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    return (
      <View style={styles.card}>
        <TouchableOpacity  style={styles.card} onPress={() =>
            router.push({
              pathname: "/chat_group/[grup_id]",
              params: { group_id: item.id, room_id: item.room_id, name: item.group_name },
            })
          }>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.group_name}</Text>
            <Text style={styles.username}>20 Users</Text>
          </View>
        </TouchableOpacity>

        
        
      </View>
    );
  };

  

  return (
        <View style={styles.container}>
        {/* Search Bar */}
        <TextInput
            style={styles.search}
            placeholder="Search users..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
        />

        {/* Users List */}
        <FlatList
            data={filteredUsers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
        />
        {/* Floating Add Button */}
        <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push("/broadcast/add")} // 👉 navigate to Add Broadcast screen
        >
            <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
        </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 10,
  },
  search: {
    backgroundColor: "#1E1E1E",
    padding: 10,
    borderRadius: 8,
    color: "#fff",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  username: {
    color: "#aaa",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
  },
  btn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  edit: {
    backgroundColor: "#2E2E2E",
  },
  toggle: {
    backgroundColor: "#2E2E2E",
  },
  delete: {
    backgroundColor: "#2E2E2E",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // shadow on Android
    shadowColor: "#000", // shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
