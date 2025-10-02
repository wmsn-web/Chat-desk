import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabProps = {
  selected: string;
  onSelect: (tab: string) => void;
};

const tabs = [
  { name: "Users", icon: "people-outline", lib: "Ionicons" },
  { name: "Recent Chats", icon: "chatbubble-ellipses-outline", lib: "Ionicons" },
  { name: "Settings", icon: "settings-outline", lib: "Ionicons" },
  { name: "Broadcast", icon: "broadcast", lib: "MaterialCommunityIcons" },
];

export default function CustomTabs({ selected, onSelect }: TabProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const IconComponent =
          tab.lib === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onSelect(tab.name)}
          >
            <IconComponent
              name={tab.icon as any}
              size={22}
              color={selected === tab.name ? "#007AFF" : "#444"}
            />
            <Text
              style={[styles.label, selected === tab.name && styles.active]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  active: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
