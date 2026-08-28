import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
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
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  // Title/body come straight from the server and often lead with a Latin
  // ticker symbol (e.g. "AAPL: ..."). Unicode bidi "auto" detection keys off
  // the first strong character, so a ticker-prefixed string gets misdetected
  // as an LTR paragraph and left-aligns even in an RTL screen — pin the
  // alignment explicitly instead of relying on auto-detection.
  const bidiTextStyle = { textAlign: isRTL ? ('right' as const) : ('left' as const), writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const) };

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dotColumn, isRTL && styles.dotColumnRTL]}>
        <View style={[styles.dot, isUnread ? styles.dotUnread : styles.dotRead]} />
      </View>
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        <Text style={[styles.title, bidiTextStyle, isUnread && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={[styles.body, bidiTextStyle]} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      <Text style={[styles.time, { textAlign: isRTL ? 'left' : 'right' }]}>
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
    marginRight: 10,
  },
  dotColumnRTL: {
    marginRight: 0,
    marginLeft: 10,
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
  contentRTL: {
    marginRight: 0,
    marginLeft: 8,
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
