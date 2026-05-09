import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { rowDirection } from '@/lib/rtl';
import { uploadChatMedia } from '@/services/chat.service';
import { getSocket } from '@/lib/socket';

interface Props {
  conversationId: string;
  onSend: (body: {
    type: 'text' | 'image' | 'voice' | 'video';
    content?: string;
    attachmentUrl?: string;
    attachmentMetadata?: Record<string, unknown>;
  }) => void;
  disabled?: boolean;
}

type PendingAttachment = {
  type: 'image' | 'voice';
  localUri: string;
  url: string;
  metadata: Record<string, unknown>;
  duration?: number;
};

export function ChatInput({ conversationId, onSend, disabled }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function emitTyping(active: boolean) {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit(active ? 'typing_start' : 'typing_stop', conversationId);
  }

  function handleTextChange(val: string) {
    setText(val);
    emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  }

  function handleSendText() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend({ type: 'text', content: trimmed });
    setText('');
    emitTyping(false);
  }

  function confirmSendAttachment() {
    if (!pendingAttachment) return;
    onSend({
      type: pendingAttachment.type,
      attachmentUrl: pendingAttachment.url,
      attachmentMetadata: pendingAttachment.metadata,
    });
    setPendingAttachment(null);
  }

  function discardAttachment() {
    setPendingAttachment(null);
  }

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.permission_required'), t('common.photo_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.fileName ?? `img_${Date.now()}.jpg`;
    const type = asset.mimeType ?? 'image/jpeg';

    setUploading(true);
    try {
      const uploaded = await uploadChatMedia({ uri: asset.uri, name, type });
      // Show preview — user must tap Send to confirm
      setPendingAttachment({
        type: 'image',
        localUri: asset.uri,
        url: uploaded.url,
        metadata: { width: uploaded.width, height: uploaded.height, size: uploaded.size },
      });
    } catch (e) {
      Alert.alert(t('common.upload_failed'), t('common.image_upload_error'));
      console.error('[ChatInput] image upload error:', e);
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(t('common.permission_required'), t('common.mic_permission'));
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 64000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
    });
    await rec.startAsync();
    recordingRef.current = rec;
    setRecording(true);
    setRecordDuration(0);

    const interval = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    (rec as unknown as { _interval?: ReturnType<typeof setInterval> })._interval = interval;
  }

  async function stopRecording(send: boolean) {
    const rec = recordingRef.current;
    if (!rec) return;

    const interval = (rec as unknown as { _interval?: ReturnType<typeof setInterval> })._interval;
    if (interval) clearInterval(interval);

    const capturedDuration = recordDuration;
    await rec.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    recordingRef.current = null;
    setRecording(false);
    setRecordDuration(0);

    if (!send) return;

    const uri = rec.getURI();
    if (!uri) return;

    setUploading(true);
    try {
      const uploaded = await uploadChatMedia({
        uri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/mp4',
      });
      // Show preview — user must tap Send to confirm
      setPendingAttachment({
        type: 'voice',
        localUri: uri,
        url: uploaded.url,
        metadata: { duration: uploaded.duration, size: uploaded.size },
        duration: capturedDuration,
      });
    } catch (e) {
      Alert.alert(t('common.upload_failed'), t('common.voice_upload_error'));
      console.error('[ChatInput] voice upload error:', e);
    } finally {
      setUploading(false);
    }
  }

  // ── Pending attachment preview ─────────────────────────────────────────────
  if (pendingAttachment) {
    return (
      <View style={[styles.previewBar, { flexDirection: rowDirection }]}>
        <TouchableOpacity onPress={discardAttachment} style={styles.previewDiscard}>
          <Ionicons name="close-circle" size={26} color={Colors.danger} />
        </TouchableOpacity>

        <View style={[styles.previewContent, { flexDirection: rowDirection }]}>
          {pendingAttachment.type === 'image' ? (
            <Image
              source={{ uri: pendingAttachment.localUri }}
              style={styles.previewThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.previewVoice, { flexDirection: rowDirection }]}>
              <Ionicons name="mic" size={22} color={Colors.primary} />
              <Text style={styles.previewVoiceText}>
                {pendingAttachment.duration !== undefined
                  ? `${Math.floor(pendingAttachment.duration / 60)}:${String(pendingAttachment.duration % 60).padStart(2, '0')}`
                  : t('chat.voice_note')}
              </Text>
            </View>
          )}
          <Text style={styles.previewHint}>{t('chat.tap_send')}</Text>
        </View>

        <TouchableOpacity
          onPress={confirmSendAttachment}
          style={styles.previewSendBtn}
          disabled={disabled}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Recording bar ──────────────────────────────────────────────────────────
  if (recording) {
    return (
      <View style={[styles.recordingBar, { flexDirection: rowDirection }]}>
        <TouchableOpacity onPress={() => stopRecording(false)} style={styles.cancelBtn}>
          <Ionicons name="close" size={22} color={Colors.danger} />
        </TouchableOpacity>
        <View style={[styles.recordingInfo, { flexDirection: rowDirection }]}>
          <View style={styles.recDot} />
          <Text style={styles.recDuration}>
            {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => stopRecording(true)} style={styles.sendVoiceBtn}>
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Normal input ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { flexDirection: rowDirection }]}>
      <TouchableOpacity
        style={styles.attachBtn}
        onPress={handlePickImage}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleTextChange}
        placeholder={t('chat.input_placeholder')}
        placeholderTextColor={Colors.textMuted}
        multiline
        maxLength={2000}
        editable={!disabled && !uploading}
      />

      {uploading ? (
        <ActivityIndicator color={Colors.primary} style={styles.sendBtn} />
      ) : text.trim() ? (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} disabled={disabled}>
          <View style={styles.sendIcon}>
            <Ionicons name="send" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.sendBtn}
          onLongPress={startRecording}
          delayLongPress={200}
          disabled={disabled}
        >
          <Ionicons name="mic-outline" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  attachBtn: {
    padding: 6,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  sendBtn: {
    padding: 6,
    marginBottom: 2,
  },
  sendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Voice recording bar
  recordingBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  cancelBtn: {
    padding: 4,
  },
  recordingInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  recDuration: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sendVoiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pending attachment preview bar
  previewBar: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  previewDiscard: {
    padding: 2,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  previewThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  previewVoice: {
    alignItems: 'center',
    gap: 6,
  },
  previewVoiceText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewHint: {
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  previewSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
