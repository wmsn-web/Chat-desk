import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

// props: route.params.user (from UsersScreen)
export default function ChatScreen({ route, navigation }) {
  const { user } = route.params; // user object passed (contains name, room_id)
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    navigation.setOptions({ title: user.name }); // set header username
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`https://your-api.com/chats/${user.room_id}`); // API call
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const newMessage = {
      id: Date.now(),
      text,
      sender: "me",
      createdAt: new Date().toISOString(),
    };

    // update UI instantly
    setMessages((prev) => [newMessage, ...prev]);
    setText("");

    try {
      await fetch(`https://your-api.com/chats/${user.room_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.sender === "me" ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        inverted // newest messages bottom
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: "#fff" }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  message: {
    padding: 10,
    margin: 6,
    borderRadius: 8,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    padding: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    paddingHorizontal: 15,
    color: "#fff",
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 20,
  },
});
