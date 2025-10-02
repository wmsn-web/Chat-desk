import DocumentMessage from "@/components/DocumentMessage";
import ImageView from "@/src/ImageView";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker"; // if not already imported
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";

//const API_BASE = "http://10.0.2.2:3696"; // your API
const API_BASE = "http://ws.playpunts.com"; // your API
const socket = io(API_BASE, { transports: ["websocket"] });

export default function ChatScreen() {
  const { room_id } = useLocalSearchParams<{ room_id: string }>();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const router = useRouter();

  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms/${room_id}/messages/user`);
      const data = await res.json();
      const sorted = (data.messages || []).sort((a: any, b: any) => b.time - a.time);
      setMessages(sorted);
    } catch (e) {
      console.error("Fetch messages failed:", e);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const formData = new FormData();
      formData.append("userid", room_id);
      formData.append("user_type", "admin");
      formData.append("messg", text);

      const res = await fetch(`${API_BASE}/rooms/${room_id}/messages`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setText("");
        if (autoScroll) flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (e) {
      console.error("Send failed:", e);
    }
  };

  useEffect(() => {
    fetchMessages();
    socket.emit("join", { roomId: room_id });
    socket.on("message_event", (payload: any) => {
      if (payload.type === "create" || payload.type === "edit") {
        const newMsg = payload.msg;
        if (newMsg.user_type === "user") {
          // optional: mark read
        }
        setMessages((prev) => {
          const exists = prev.some((m) => m.msg_id === newMsg.msg_id);
          if (exists) return prev;
          return [newMsg, ...prev];
        });
        if (autoScroll) flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else if (payload.type === "delete") {
        setMessages((prev) => prev.filter((m) => m.msg_id !== payload.msg_id));
      } else if (payload.type === "bulk_delete") {
        setMessages([]);
      }
    });

    return () => {
      socket.off("message_event");
    };
  }, [room_id, autoScroll]);

  // ----------------- Attach handlers (TypeScript-safe) -----------------
  // Document picker with Option A runtime narrowing
  // add at top if not present:
// import * as FileSystem from "expo-file-system";
// import * as DocumentPicker from "expo-document-picker";
// import { Alert } from "react-native";

const openDocumentPicker = async () => {
  try {
    setAttachModalVisible(false);

    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    console.log("DocumentPicker result:", JSON.stringify(res));

    // 1) Newer shape: { assets: [ { uri, name, mimeType, size } ], canceled: false }
    if ("assets" in res && Array.isArray((res as any).assets) && (res as any).assets.length > 0) {
      const asset = (res as any).assets[0];
      const uri: string = asset.uri;
      const name: string = asset.name ?? uri.split("/").pop() ?? `document-${Date.now()}`;
      const mimeType: string | undefined = asset.mimeType ?? asset.type;
      await handleAndUploadUri(uri, name, mimeType);
      return;
    }

    // 2) Older shape: { type: 'success', uri, name, mimeType }
    // 3) Or shape with top-level uri
    if ("uri" in res && (res as any).uri) {
      const uri: string = (res as any).uri;
      const name: string = (res as any).name ?? uri.split("/").pop() ?? `document-${Date.now()}`;
      const mimeType: string | undefined = (res as any).mimeType ?? (res as any).type;
      await handleAndUploadUri(uri, name, mimeType);
      return;
    }

    // 4) Cancelled
    if ((res as any).canceled === true || (res as any).type === "cancel") {
      console.log("Document pick cancelled by user");
      return;
    }

    // Unknown shape
    console.warn("Document pick returned unexpected shape:", res);
    Alert.alert("Error", "Could not read picked file. See console for details.");
  } catch (err) {
    console.error("openDocumentPicker error:", err);
    Alert.alert("Error", "Unable to pick document. See console for details.");
  }
};

/**
 * Helper: ensure we have a file:// uri (copy content:// if needed) then call uploadFile
 */
const handleAndUploadUri = async (uri: string, name: string, mimeType?: string) => {
  try {
    let uploadUri = uri;
    console.log("Picked file:", { uri: uploadUri, name, mimeType });

    // If content:// on Android, copy to cache
    if (uploadUri.startsWith("content://")) {
      try {
        const dest = FileSystem.cacheDirectory + (name || `doc-${Date.now()}`);
        console.log("Copying content:// ->", dest);
        const dl = await FileSystem.downloadAsync(uploadUri, dest);
        console.log("downloadAsync result:", dl);
        uploadUri = dl.uri;
      } catch (err) {
        console.warn("Failed to copy content:// to cache:", err);
        // we'll still try to upload original URI, but it may fail
      }
    }

    // If we got a file:// path (most common with copyToCacheDirectory), proceed
    console.log("Final uploadUri:", uploadUri);
    await uploadFile({
      uri: uploadUri,
      name,
      type: mimeType ?? guessMimeType(name),
    });
  } catch (err) {
    console.error("handleAndUploadUri error:", err);
    Alert.alert("Upload error", "Could not prepare file for upload.");
  }
};


  const openImageLibrary = async () => {
    try {
      setAttachModalVisible(false);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow access to photos to choose an image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      // Newer expo returns { canceled, assets } structure
      // handle both older and newer return shapes:
      // @ts-ignore
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.fileName ?? uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        const type = asset.type === "image" ? guessMimeType(name) : "application/octet-stream";
        await uploadFile({ uri, name, type });
      } else if ((result as any).uri) {
        const r = result as any;
        const uri = r.uri;
        const name = r.fileName ?? uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        await uploadFile({ uri, name, type: guessMimeType(name) });
      }
    } catch (err) {
      console.error("Image pick error", err);
    }
  };

  const openCamera = async () => {
    try {
      setAttachModalVisible(false);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow camera access to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      // handle new/old shapes:
      // @ts-ignore
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.fileName ?? uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        await uploadFile({ uri, name, type: guessMimeType(name) });
      } else if ((result as any).uri) {
        const r = result as any;
        const uri = r.uri;
        const name = r.fileName ?? uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        await uploadFile({ uri, name, type: guessMimeType(name) });
      }
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  // upload file as "file" field (backend expects upload.single('file'))
  const uploadFile = async (file: { uri: string; name: string; type?: string }) => {
  try {
    setUploading(true);

    const form = new FormData();
    form.append("userid", room_id);
    form.append("user_type", "admin");
    form.append("messg", ""); // optional caption

    // RN expects special file object shape for FormData
    // @ts-ignore
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type ?? guessMimeType(file.name),
    });

    console.log("Sending upload request to", `${API_BASE}/rooms/${room_id}/messages`);
    const resp = await fetch(`${API_BASE}/rooms/${room_id}/messages`, {
      method: "POST",
      body: form,
      // DO NOT set Content-Type header — RN will set multipart boundary
    });

    console.log("Upload HTTP status:", resp.status);
    const text = await resp.text();
    console.log("Upload response text:", text);

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn("Response was not JSON:", e);
    }

    if (resp.ok && data && data.success) {
      console.log("Upload succeeded", data);
      if (autoScroll) flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      console.warn("Upload failed or backend returned error", resp.status, data);
      Alert.alert("Upload failed", data?.error || `Server returned ${resp.status}`);
    }
  } catch (err) {
    console.error("Upload failed (network/exception):", err);
    Alert.alert("Upload failed", "Network error or file read error. See console.");
  } finally {
    setUploading(false);
  }
};

const guessMimeType = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  if (ext === "doc") return "application/msword";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
};

  const readMessages = async (msg_id: string, room_id: string) => {
    try {
      await fetch(`${API_BASE}/rooms/${room_id}/message/${msg_id}/1`);
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  // Render helper: check extension -> image or doc
  const isImageFile = (fileNameOrLink?: string | null) => {
    if (!fileNameOrLink) return false;
    const name = fileNameOrLink.split("/").pop() ?? fileNameOrLink;
    const ext = name.split(".").pop()?.toLowerCase();
    return !!ext && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  };

  const openFileLink = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Can't open file", "No app found to open this file.");
      }
    } catch (err) {
      console.error("openFileLink error", err);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      // Confirm dialog
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              // Call DELETE API
              const res = await fetch(
                `${API_BASE}/rooms/${room_id}/messages/${msgId}`,
                { method: "DELETE" }
              );

              if (res.ok) {
                // Remove from UI
                setMessages((prev) => prev.filter((m) => m.id !== msgId));
              } else {
                Alert.alert("Error", "Failed to delete message.");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{name} {room_id}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
                  item.user_type === "admin" ? styles.myMessage : styles.otherMessage,
                ]}
              >
                
                <TouchableOpacity onLongPress={() => setMenuVisible(item.msg_id)}>
                  {menuVisible === item.msg_id && (
                    <View
                      style={{
                        position: "relative",
                        right: 3,
                        top: 28,
                        backgroundColor: "#f5f1f1ff",
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        zIndex: 100,
                        width: 80
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setMenuVisible(null);
                          deleteMessage(item.msg_id);
                        }}
                      >
                        <Text style={{ color: "red" }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* text */}
                  {item.messg ? <Text style={styles.messageText}>{item.messg}</Text> : null}

                  {/* file rendering */}
                  {item.file_link ? (
                    <>
                      {isImageFile(item.file_name || item.file_link) ? (
                        <ImageView uri={`${API_BASE}${item.file_link}`} />
                      ) : (
                        <DocumentMessage
                          fileName={item.file_name}
                          onPress={() => openFileLink(`${API_BASE}${item.file_link}`)}
                        />
                        
                      )}
                    </>
                  ) : null}

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 6 }}>
                    <Text style={styles.messageTime}>{new Date(item.time).toLocaleTimeString()}</Text>
                    {item.user_type == "admin" ? (
                      <MaterialCommunityIcons
                        name="check-all"
                        size={16}
                        color={item.read ? "rgba(4, 155, 255, 1)" : "gray"}
                        style={{ marginRight: 4, marginLeft: 6 }}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>  
              </View>
            
          )}
          contentContainerStyle={{ padding: 10 }}
          onScrollBeginDrag={() => setAutoScroll(false)}
        />

        <Modal visible={attachModalVisible} animationType="slide" transparent>
          <Pressable style={styles.modalOverlay} onPress={() => setAttachModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.iconBox} onPress={openDocumentPicker}>
                <Ionicons style={{color: "#747171ff"}} name="document" size={28} />
                <Text>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBox} onPress={openImageLibrary}>
                <Ionicons style={{color: "#747171ff"}} name="images" size={28} />
                <Text>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBox} onPress={openCamera}>
                <Ionicons style={{color: "#747171ff"}} name="camera" size={28} />
                <Text>Camera</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setAttachModalVisible(false)} style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#007AFF" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={() => setAttachModalVisible(true)}>
            <Ionicons name="attach" size={25} color="#fdf6f6ff" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#fff"
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
  safeArea: { flex: 1, backgroundColor: "#272626ff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#232424ff",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomColor: "#fff"
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
    backgroundColor: "#272626ff",
    alignItems: "center",
  },
  attachButton: {
    padding: 8,
    marginRight: 6,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#575353ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minHeight: 45,
    color:" #fff",
  },
  
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  /* modal */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    backgroundColor: "white",
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, marginBottom: 8 },
  iconBox: { alignItems: "center", color: "#3f3b3bff" },
  docRow: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
});
