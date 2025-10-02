import React, { useState } from "react";
import { Image, Modal, StyleSheet, TouchableOpacity } from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";

export default function ImageView({ uri }: { uri: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image
          source={{ uri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Fullscreen modal */}
      <Modal visible={visible} transparent={true} onRequestClose={() => setVisible(false)}>
        <ImageViewer
          imageUrls={[{ url: uri }]} // must be array of {url}
          enableSwipeDown
          onSwipeDown={() => setVisible(false)}
          onCancel={() => setVisible(false)}
          saveToLocalByLongPress={false}
          backgroundColor="black"
           // hide 1/1 text
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
});
