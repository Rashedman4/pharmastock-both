import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { AutoText } from '@/components/ui/AutoText';
import type { InAppNotification } from '@/types/content';

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t('notifications.just_now');
  if (minutes < 60) return t('notifications.minutes_ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.hours_ago', { count: hours });
  return t('notifications.days_ago', { count: Math.floor(hours / 24) });
}

interface Props {
  notification: InAppNotification;
  onPress: () => void;
}

export const NotificationItem = React.memo(function NotificationItem({ notification, onPress }: Props) {
  const isUnread = notification.read_at === null;
  const { t } = useTranslation();

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
        <AutoText style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </AutoText>
        <AutoText style={styles.body} numberOfLines={2}>
          {notification.body}
        </AutoText>
      </View>
      <Text style={styles.time}>
        {formatRelativeTime(notification.created_at, t)}
      </Text>
    </TouchableOpacity>
  );
});

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
    marginEnd: 10,
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
    marginEnd: 8,
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
