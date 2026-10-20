import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import { useNewsItem } from "@/hooks/useContent";
import type { AppColors } from "@/constants/colors";
import { useTheme } from "@/lib/theme";
import { useLocalizedField } from "@/lib/i18n-content";
import { useRTL } from "@/lib/rtl";
import { stockHref } from "@/lib/stockLink";
import { formatDate } from "@/lib/format";
import { AutoText } from "@/components/ui/AutoText";
import { Ionicons } from "@expo/vector-icons";

export default function NewsDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getField = useLocalizedField();
  const { isRTL } = useRTL();
  const { data: item, isLoading, isError } = useNewsItem(Number(id));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <TouchableOpacity onPress={() => goBackOr("/(tabs)/news")}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBackOr("/(tabs)/news")}
          style={styles.backBtn}
        >
          <Ionicons
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={26}
            color={colors.primaryText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {item.symbol}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.symbolRow}>
          <TouchableOpacity
            style={styles.symbolPill}
            onPress={() => router.push(stockHref(item.symbol) as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.symbolText}>{item.symbol}</Text>
          </TouchableOpacity>
        </View>

        <AutoText style={styles.title}>{getField(item, "title")}</AutoText>

        <Text style={styles.date}>
          {formatDate(item.published_date, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  backBtn: { width: 40, justifyContent: "center" },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.primaryText,
    flex: 1,
    textAlign: "center",
  },
  content: { padding: 16 },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  symbolPill: {
    backgroundColor: c.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + "30",
  },
  symbolText: { fontSize: 13, fontWeight: "700", color: c.primaryText },
  price: { fontSize: 18, fontWeight: "800", color: c.accent },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: c.textPrimary,
    lineHeight: 28,
    marginBottom: 12,
  },
  date: { fontSize: 13, color: c.textMuted },
  errorText: { fontSize: 16, color: c.danger, marginBottom: 12 },
  backLink: { color: c.accent, fontWeight: "600" },
});
