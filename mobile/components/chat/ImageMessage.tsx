import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

const SCREEN = Dimensions.get('window');

interface Props {
  uri: string;
  width?: number | null;
  height?: number | null;
}

export function ImageMessage({ uri, width, height }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const thumbW = Math.min(220, SCREEN.width * 0.6);
  const thumbH = width && height ? (thumbW / width) * height : thumbW * 0.75;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Image
          source={{ uri }}
          style={[styles.thumbnail, { width: thumbW, height: thumbH }]}
          onLoad={() => setLoading(false)}
          cachePolicy="disk"
          transition={150}
        />
        {loading && (
          <View style={[styles.loadingOverlay, { width: thumbW, height: thumbH }]}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Image
            source={{ uri }}
            style={styles.fullImage}
            contentFit="contain"
            cachePolicy="disk"
          />
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  thumbnail: {
    borderRadius: 12,
    backgroundColor: c.backgroundSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  fullImage: {
    width: SCREEN.width,
    height: SCREEN.height * 0.8,
  },
});
