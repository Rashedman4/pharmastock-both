import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator, TextInput, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth.store';
import { fetchTradePlanMessages, sendTradePlanMessage } from '@/services/elite.service';
import type { TradePlanMessage } from '@/types/elite';

function MessageBubble({ msg, currentUserId }: { msg: TradePlanMessage; currentUserId: number }) {
  const { t } = useTranslation();
  const isOwn = msg.sender_user_id === currentUserId;
  const senderName = isOwn
    ? t('elite.you')
    : `${msg.firstname ?? ''} ${msg.lastname ?? ''}`.trim() || t('elite.admin');

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isOwn && <Text style={styles.senderName}>{senderName}</Text>}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwnBg : styles.bubbleOtherBg]}>
        <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
          {msg.message_text}
        </Text>
      </View>
      <Text style={[styles.time, isOwn && { textAlign: 'right' }]}>
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

export default function TradePlanMessagesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trade-plan-messages', id],
    queryFn: () => fetchTradePlanMessages(Number(id)),
    refetchInterval: 10_000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendTradePlanMessage(Number(id), text.trim()),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['trade-plan-messages', id] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={data?.data ?? []}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <MessageBubble msg={item} currentUserId={user?.id ?? 0} />
          )}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t('elite.message_placeholder')}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>{t('chat.send')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  list: { padding: 16, paddingBottom: 8 },
  empty: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  bubbleWrapper: { marginBottom: 12, maxWidth: '80%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  senderName: { fontSize: 11, color: Colors.textMuted, marginBottom: 3, fontWeight: '600' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwnBg: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOtherBg: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextOwn: { color: '#fff' },
  bubbleTextOther: { color: Colors.text },
  time: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
