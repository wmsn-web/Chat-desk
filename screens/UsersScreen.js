import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const router = useRouter();

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://api.playpunts.com/admin_api/allUsers"); // ⬅️ replace with your API
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const initials = item.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    return (
      <View style={styles.card}>
        <TouchableOpacity  style={styles.card} onPress={() =>
            router.push({
              pathname: "/chat/[room_id]",
              params: { room_id: item.room_id, name: item.name },
            })
          }>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.username}>{item.username}</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.edit]} onPress={() => handleEdit(item)}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.toggle]} onPress={() => handleToggle(item)}>
            <Text>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.delete]} onPress={() => handleDelete(item)}>
            <Text>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleEdit = (user) => {
    console.log("Edit:", user);
    // Navigate or open modal
  };

  const handleToggle = (user) => {
    console.log("Toggle active/suspend:", user);
    // Call API to suspend/unsuspend
  };

  const handleDelete = (user) => {
    console.log("Delete:", user);
    // Call API to delete
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
});
