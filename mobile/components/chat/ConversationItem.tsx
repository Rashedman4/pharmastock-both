import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { isRTL, rowDirection } from '@/lib/rtl';
import type { Conversation } from '@/types/content';

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface Props {
  conversation: Conversation;
  onPress: () => void;
}

export const ConversationItem = React.memo(function ConversationItem({ conversation, onPress }: Props) {
  const unread = conversation.userUnreadCount;

  return (
    <TouchableOpacity style={[styles.container, { flexDirection: rowDirection }]} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={[styles.avatar, isRTL && styles.avatarRTL]}>
        <Ionicons name="person-circle" size={44} color={Colors.primary} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.row, { flexDirection: rowDirection }]}>
          <Text style={styles.name}>Admin</Text>
          <Text style={styles.time}>{formatTime(conversation.lastMessageAt)}</Text>
        </View>
        <View style={[styles.row, { flexDirection: rowDirection }]}>
          <Text style={[styles.preview, isRTL && styles.previewRTL]} numberOfLines={1}>
            {conversation.lastMessagePreview ?? 'No messages yet'}
          </Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    marginRight: 12,
  },
  avatarRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginRight: 8,
  },
  previewRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
