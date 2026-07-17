import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ImageMessage } from './ImageMessage';
import { VoiceMessage } from './VoiceMessage';
import { VideoMessage } from './VideoMessage';
import type { ChatMessage } from '@/types/content';

interface Props {
  message: ChatMessage;
  myUserId: number;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MessageBubble = React.memo(function MessageBubble({ message, myUserId }: Props) {
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
          <Text style={fromAdmin ? styles.adminText : styles.userText}>
            {message.content}
          </Text>
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  adminText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  userText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 21,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  adminTime: {
    color: Colors.textMuted,
    textAlign: 'left',
  },
  userTime: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'right',
  },
});
