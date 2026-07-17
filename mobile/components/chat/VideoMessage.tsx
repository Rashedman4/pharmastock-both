import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
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
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const thumbW = Math.min(220, SCREEN.width * 0.6);
  const thumbH = width && height ? (thumbW / width) * height : thumbW * 0.75;

  function handleStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded && loading) setLoading(false);
  }

  return (
    <View style={[styles.container, { width: thumbW, height: thumbH }]}>
      {started ? (
        // Only mounted once tapped — avoids every video in a long chat history
        // buffering/decoding simultaneously while the user is just scrolling.
        <Video
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={handleStatusUpdate}
        />
      ) : (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => {
            setLoading(true);
            setStarted(true);
          }}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.playButton}>
              <Ionicons name="play" size={26} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
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
});
