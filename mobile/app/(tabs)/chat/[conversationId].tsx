import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useMessages, useSendMessage, useSocketMessages } from '@/hooks/useChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatMessage } from '@/types/content';

export default function ChatThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [adminTyping, setAdminTyping] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const sendMessage = useSendMessage(conversationId);

  const handleTyping = useCallback((typing: boolean) => {
    setAdminTyping(typing);
  }, []);

  useSocketMessages(conversationId, handleTyping);

  // Data from API is chronological (oldest first). Reverse each page so newest = index 0.
  // FlatList inverted renders index 0 at the visual bottom (newest message at bottom). ✓
  // Dedup by ID: guards against the race where socket appends a message before onSuccess does.
  const messages = React.useMemo(() => {
    const flat = data?.pages.flatMap((p) => [...p.data].reverse()) ?? [];
    const seen = new Set<string>();
    return flat.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = useCallback(
    (body: Parameters<typeof sendMessage.mutate>[0]) => {
      sendMessage.mutate(body);
    },
    [sendMessage]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Admin</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list — inverted so newest is at bottom */}
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} myUserId={user?.id ?? 0} />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={adminTyping ? <TypingIndicator /> : null}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={Colors.primary}
                size="small"
                style={styles.loadingMore}
              />
            ) : null
          }
        />

        {/* Input */}
        <ChatInput
          conversationId={conversationId}
          onSend={handleSend}
          disabled={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 4,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: 16,
  },
});
