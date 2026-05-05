import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  uri: string;
  duration?: number | null;
  isAdmin: boolean;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceMessage({ uri, duration, isAdmin }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  async function togglePlay() {
    if (playing && sound) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }

    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPosition(status.positionMillis / 1000);
          setTotal(status.durationMillis ? status.durationMillis / 1000 : total);
          if (status.didJustFinish) {
            setPlaying(false);
            setPosition(0);
          }
        }
      );
      setSound(s);
      setPlaying(true);
    } catch (e) {
      console.warn('[Voice] play error:', e);
    }
  }

  const progress = total > 0 ? Math.min(position / total, 1) : 0;
  const bubbleStyle = isAdmin ? styles.adminBar : styles.userBar;

  return (
    <View style={[styles.container, isAdmin ? styles.adminContainer : styles.userContainer]}>
      <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={22}
          color={isAdmin ? Colors.textPrimary : Colors.white}
        />
      </TouchableOpacity>

      {/* Waveform bar */}
      <View style={styles.trackContainer}>
        <View style={[styles.track, bubbleStyle]}>
          <View style={[styles.progress, bubbleStyle, { flex: progress }]} />
        </View>
      </View>

      <Text style={[styles.duration, isAdmin ? styles.adminText : styles.userText]}>
        {formatDuration(playing ? position : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
    maxWidth: 240,
  },
  adminContainer: {},
  userContainer: {},
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  trackContainer: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  adminBar: { backgroundColor: 'rgba(10,36,114,0.15)' },
  userBar: { backgroundColor: 'rgba(255,255,255,0.3)' },
  progress: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  adminText: { color: Colors.textMuted },
  userText: { color: 'rgba(255,255,255,0.8)' },
});
