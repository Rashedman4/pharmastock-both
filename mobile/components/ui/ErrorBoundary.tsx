import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import type { AppColors } from '@/constants/colors';
import { currentColors } from '@/lib/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      // A class component cannot call useTheme, and this boundary sits above
      // the provider anyway (so it still renders when the provider is what
      // threw). It reads the resolved palette directly instead.
      const styles = makeStyles(currentColors());

      return this.props.fallback ?? (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <Button title="Try Again" onPress={this.handleReset} containerStyle={styles.button} />
        </View>
      );
    }
    return this.props.children;
  }
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: c.background,
  },
  title: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 8 },
  message: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: { width: 160 },
});
