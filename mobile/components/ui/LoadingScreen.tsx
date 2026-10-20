import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={colors.primaryText} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.background,
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
    color: c.textSecondary,
  },
});
