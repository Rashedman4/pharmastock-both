import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNewsItem } from '@/hooks/useContent';
import { Colors } from '@/constants/colors';
import { useLocalizedField } from '@/lib/i18n-content';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getField = useLocalizedField();
  const { data: item, isLoading, isError } = useNewsItem(Number(id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.symbolRow}>
          <View style={styles.symbolPill}>
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </View>
          {item.price != null && (
            <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
          )}
        </View>

        <Text style={styles.title}>{getField(item, 'title')}</Text>

        <Text style={styles.date}>
          {formatDate(item.published_date)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backArrow: { fontSize: 28, color: Colors.primary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, flex: 1, textAlign: 'center' },
  content: { padding: 16 },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  symbolPill: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  symbolText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  price: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  date: { fontSize: 13, color: Colors.textMuted },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: 12 },
  backLink: { color: Colors.accent, fontWeight: '600' },
});
