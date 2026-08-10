import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const SCREEN = Dimensions.get('window');

interface Props {
  uri: string;
  width?: number | null;
  height?: number | null;
}

export function VideoMessage({ uri, width, height }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chat-bubble thumbnail size only — the real playback surface is the
  // fullscreen modal below, so this box never needs to match the video's
  // actual aspect ratio.
  const thumbW = Math.min(220, SCREEN.width * 0.6);
  const thumbH = width && height ? (thumbW / width) * height : thumbW * 0.75;

  function handleStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded && loading) setLoading(false);
  }

  return (
    <>
      <View style={[styles.container, { width: thumbW, height: thumbH }]}>
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => {
            setLoading(true);
            setOpen(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.playButton}>
            <Ionicons name="play" size={26} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          {open && (
            // Only mounted while the modal is open — closing unmounts it,
            // which stops playback and releases the player immediately
            // (no need to manually pause on close).
            <Video
              source={{ uri }}
              style={styles.fullVideo}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onPlaybackStatusUpdate={handleStatusUpdate}
            />
          )}

          {loading && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color={Colors.white} />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  fullVideo: {
    width: SCREEN.width,
    height: SCREEN.height * 0.8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
