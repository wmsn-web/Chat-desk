import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  fileName: string;
  onPress?: () => void;
};

const documentIcons: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "file-pdf-box", color: "#d9534f" }, // red
  doc: { icon: "file-word", color: "#2a5699" }, // blue
  docx: { icon: "file-word", color: "#2a5699" }, // blue
  xls: { icon: "file-excel", color: "#217346" }, // green
  xlsx: { icon: "file-excel", color: "#217346" }, // green
  default: { icon: "file-document", color: "#6c757d" }, // gray
};

// helper to extract file extension
function getFileType(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "default";
}

const DocumentMessage: React.FC<Props> = ({ fileName, onPress }) => {
  const fileType = getFileType(fileName);
  const { icon, color } = documentIcons[fileType] || documentIcons.default;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <MaterialCommunityIcons name={icon as any} size={40} color={color} />
      <Text style={styles.text} numberOfLines={1}>
        {fileName}
      </Text>
    </TouchableOpacity>
  );
};

export default DocumentMessage;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "80%",
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    flexShrink: 1,
  },
});
