import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { io } from "socket.io-client";

const API_BASE = "http://ws.playpunts.com"; // Emulator base URL
//const API_BASE = "http://10.0.2.2:3696"; // Emulator base URL
const socket = io(API_BASE, { transports: ["websocket"] });

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  let hours = date.getHours();
  let minutes: any = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
};

export default function ChatScreen() {
  const { group_id } = useLocalSearchParams<{ group_id: string }>();
  const { room_id } = useLocalSearchParams<{ room_id: string }>();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const router = useRouter();
  
  // fetch old messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/group/${group_id}/messagesAll`);
      const data = await res.json();
      const sorted = data.messages.sort((a: any, b: any) => b.time - a.time);
      console.log(sorted);
      setMessages(sorted);
    } catch (e) {
      console.error("Fetch messages failed:", e);
    }
  };

  

  // send new message
  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const formData = new FormData();
      formData.append("userid", room_id); // admin → userid = room_id
      formData.append("user_type", "admin");
      formData.append("messg", text);

      const res = await fetch(`${API_BASE}/group/${group_id}/messages`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const newMsg = data.msg;
        //setMessages((prev) => [newMsg, ...prev]);
        setText("");

        if (autoScroll) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } catch (e) {
      console.error("Send failed:", e);
    }
  };
/*
  useEffect(() => {
    fetchMessages();

    
    socket.emit("join", { roomId: room_id });
    
    socket.on("message_event", (payload: any) => {
      const newMsg = payload.msg;
      setMessages((prev) => {
        console.log(newMsg);
        const exists = prev.some((m) => m.msg_id === newMsg.msg_id);
        if (exists) return prev;
        return [newMsg, ...prev];
      });
      

      if (autoScroll) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    return () => {
      socket.off("message_event");
    };
  }, [room_id, autoScroll]);
*/




  useEffect(() => {
    fetchMessages();
  socket.emit("join", { roomId: room_id });

  socket.on("message_event", (payload: any) => {
    if (payload.type === "create" || payload.type === "edit") {
      const newMsg = payload.msg;
      
      
      setMessages((prev) => {
        const exists = prev.some((m) => m.unique_id === newMsg.unique_id);
        if (exists) return prev;
        return [newMsg, ...prev];
      });
    } else if (payload.type === "delete") {
      setMessages((prev) => prev.filter((m) => m.unique_id !== payload.unique_id));
    } else if (payload.type === "bulk_delete") {
      setMessages([]); // clear all messages from this room
    }
  });

  return () => {
    socket.off("message_event");
  };
}, [room_id, autoScroll]);

 

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{name} </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"} // iOS padding, Android height
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // adjust if header overlaps
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item, index) =>
            item.msg_id ? String(item.msg_id) : `msg-${index}`
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.user_type === "admin"
                  ? styles.myMessage
                  : styles.otherMessage,
              ]}
            >
              {item.messg ? (
                <Text style={styles.messageText}>{item.messg}</Text>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
              <Text style={styles.messageTime}>
                {new Date(item.time).toLocaleTimeString()}
              </Text>
              {item.user_type == "admin" ? (
                  <MaterialCommunityIcons
                  name="check-all"
                  size={16}
                  color= {item.read ? "rgba(4, 155, 255, 1)" : "gray"}
                  style={{ marginRight: 4, marginLeft: 2 }}

                />
              ): null}
            </View>
              
              
            </View>
          )}
          contentContainerStyle={{ padding: 10 }}
          onScrollBeginDrag={() => setAutoScroll(false)}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={{ color: "white" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f0f0" },
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#075E54", // WhatsApp green
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  backButton: { marginRight: 10 },
  topBarTitle: { color: "white", fontSize: 18, fontWeight: "bold" },

  
  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  myMessage: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  messageText: { fontSize: 16 },
  messageTime: {
    fontSize: 10,
    color: "gray",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "white",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
