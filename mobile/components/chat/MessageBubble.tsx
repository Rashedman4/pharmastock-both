import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { ImageMessage } from './ImageMessage';
import { VoiceMessage } from './VoiceMessage';
import { VideoMessage } from './VideoMessage';
import { formatTime } from '@/lib/format';
import { AutoText } from '@/components/ui/AutoText';
import type { ChatMessage } from '@/types/content';

interface Props {
  message: ChatMessage;
  myUserId: number;
}

export const MessageBubble = React.memo(function MessageBubble({ message, myUserId }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isMe = message.senderType === 'user' && message.senderId === myUserId;
  const isAdmin = message.senderType === 'admin';
  const fromAdmin = isAdmin || (!isMe);

  return (
    <View style={[styles.wrapper, fromAdmin ? styles.leftWrapper : styles.rightWrapper]}>
      <View
        style={[
          styles.bubble,
          fromAdmin ? styles.adminBubble : styles.userBubble,
        ]}
      >
        {message.messageType === 'text' && (
          <AutoText style={fromAdmin ? styles.adminText : styles.userText}>
            {message.content}
          </AutoText>
        )}

        {message.messageType === 'image' && message.attachmentUrl && (
          <ImageMessage
            uri={message.attachmentUrl}
            width={message.attachmentMetadata.width as number | null}
            height={message.attachmentMetadata.height as number | null}
          />
        )}

        {message.messageType === 'voice' && message.attachmentUrl && (
          <VoiceMessage
            uri={message.attachmentUrl}
            duration={message.attachmentMetadata.duration as number | null}
            isAdmin={fromAdmin}
          />
        )}

        {message.messageType === 'video' && message.attachmentUrl && (
          <VideoMessage
            uri={message.attachmentUrl}
            width={message.attachmentMetadata.width as number | null}
            height={message.attachmentMetadata.height as number | null}
          />
        )}

        <Text style={[styles.time, fromAdmin ? styles.adminTime : styles.userTime]}>
          {formatTime(message.createdAt)}
          {!fromAdmin && message.readAt && '  ✓✓'}
        </Text>
      </View>
    </View>
  );
});

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  leftWrapper: {
    alignItems: 'flex-start',
  },
  rightWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  adminBubble: {
    backgroundColor: c.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: c.primary,
    borderBottomRightRadius: 4,
  },
  adminText: {
    fontSize: 15,
    color: c.textPrimary,
    lineHeight: 21,
  },
  userText: {
    fontSize: 15,
    color: c.white,
    lineHeight: 21,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  adminTime: {
    color: c.textMuted,
    textAlign: 'left',
  },
  userTime: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
});
