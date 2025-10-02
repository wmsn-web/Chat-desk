import React from "react";
import { BackHandler, StyleSheet, ToastAndroid, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import CustomTabs from "@/components/CustomTabs";
import BroadcastScreen from "@/screens/BroadcastScreen";
import LoginScreen from "@/screens/LoginScreen";
import RecentChats from "@/screens/RecentChats";
import SettingScreen from "@/screens/SettingScreen";
import UsersScreen from "@/screens/UsersScreen";
import { useAuth } from "@/src/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = React.useState("Recent Chats");
  const {admin} = useAuth();
  const backPressRef = React.useRef(0);

  React.useEffect(() => {
    if (admin) {
      setActiveTab("Recent Chats");
    }
  }, [admin]);

   React.useEffect(() => {
    const backAction = () => {
      if (activeTab !== "Recent Chats") {
        // Go back to Recent Chats instead of closing app
        setActiveTab("Recent Chats");
        return true; 
      }

      const now = Date.now();
      if (backPressRef.current && now - backPressRef.current < 2000) {
        // Exit app if pressed twice within 2s
        BackHandler.exitApp();
        return true;
      }

      backPressRef.current = now;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab]);

  // If no user, show Login screen
  if (!admin) {
    return <LoginScreen />;
    
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "Users":
        return <UsersScreen />; 
      case "Recent Chats":
        return <RecentChats />;
      case "Settings":
        return <SettingScreen />;
      case "Broadcast":
        return <BroadcastScreen />
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
     {activeTab !== "Settings" ? (
        <AppHeader title={activeTab} />
      ) : null}
      
      <View style={styles.content}>{renderScreen()}</View>
      <CustomTabs selected={activeTab} onSelect={setActiveTab} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // dark theme background
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});

