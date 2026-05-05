import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { InAppNotification } from '@/types/content';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface Props {
  notification: InAppNotification;
  onPress: () => void;
}

export function NotificationItem({ notification, onPress }: Props) {
  const isUnread = notification.read_at === null;

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dotColumn}>
        <View style={[styles.dot, isUnread ? styles.dotUnread : styles.dotRead]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      <Text style={styles.time}>{formatRelativeTime(notification.created_at)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  unread: {
    backgroundColor: Colors.backgroundSecondary,
  },
  dotColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 5,
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotUnread: {
    backgroundColor: Colors.primary,
  },
  dotRead: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  titleUnread: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    minWidth: 28,
    textAlign: 'right',
  },
});
