// SettingScreen.js
import { useAuth } from "@/src/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // expo vector icons
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { logout } = useAuth();

  

  const handleLogout = async () => {
    await logout();
    Alert.alert("You have logged out successfully");
    console.log("User logged out");
    // Example: navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push({
                pathname: '/'
            })}>
            <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 24 }} /> 
            {/* placeholder to balance header (so title stays centered) */}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
            <Text style={styles.text}>Your settings options go here...</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2e2d2dff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#5f5e5eff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#fcf8f8ff",
  },
  logoutButton: {
    backgroundColor: "red",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
