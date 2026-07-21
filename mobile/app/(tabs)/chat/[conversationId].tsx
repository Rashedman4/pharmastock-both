import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
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
  const listRef = useRef<FlashListRef<ChatMessage>>(null);
  const { isRTL } = useRTL();

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

  // Each fetched page is chronological (oldest→newest) internally, but page 0 is the
  // *newest* batch (cursor pagination walks backward in time as more pages load).
  // FlashList v2 has no `inverted` prop, so we build one fully chronological
  // (oldest→newest) array by reversing the page order, and rely on
  // maintainVisibleContentPosition to start/stay at the bottom.
  // Dedup by ID: guards against the race where socket appends a message before onSuccess does.
  const messages = React.useMemo(() => {
    const pages = data?.pages ?? [];
    const flat = [...pages].reverse().flatMap((p) => p.data);
    const seen = new Set<string>();
    return flat.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [data]);

  // Older messages live in later pages; with a non-inverted list they're loaded
  // by scrolling toward the top (start) of the list.
  const handleStartReached = useCallback(() => {
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
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={26} color={Colors.primary} />
        </TouchableOpacity>
        <View style={[styles.headerInfo, isRTL && styles.headerInfoRTL]}>
          <Text style={styles.headerName}>Admin</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list — chronological order, pinned to bottom */}
        <FlashList
          ref={listRef}
          data={messages}
          keyExtractor={(item: ChatMessage) => item.id}
          renderItem={({ item }: { item: ChatMessage }) => (
            <MessageBubble message={item} myUserId={user?.id ?? 0} />
          )}
          contentContainerStyle={styles.listContent}
          maintainVisibleContentPosition={{
            startRenderingFromBottom: true,
            autoscrollToBottomThreshold: 0.2,
          }}
          onStartReached={handleStartReached}
          onStartReachedThreshold={0.3}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={Colors.primary}
                size="small"
                style={styles.loadingMore}
              />
            ) : null
          }
          ListFooterComponent={adminTyping ? <TypingIndicator /> : null}
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
  headerInfoRTL: {
    marginLeft: 0,
    marginRight: 4,
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
