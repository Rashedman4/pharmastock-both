import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '@/constants/colors';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  spinner: {
    marginTop: 4,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
