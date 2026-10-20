import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { AutoText } from "@/components/ui/AutoText";
import type { AppColors } from "@/constants/colors";
import { useTheme } from "@/lib/theme";
import { useLocalizedField } from "@/lib/i18n-content";
import { stockHref } from "@/lib/stockLink";
import type { NewsItem } from "@/types/content";

interface NewsCardProps {
  item: NewsItem;
  onPress?: () => void;
}

export const NewsCard = React.memo(function NewsCard({
  item,
  onPress,
}: NewsCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const getField = useLocalizedField();

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
    if (days === 0) return t("news.today");
    if (days === 1) return t("news.one_day_ago");
    if (days < 30) return t("news.days_ago", { count: days });
    const months = Math.floor(days / 30);
    return months === 1
      ? t("news.one_month_ago")
      : t("news.months_ago", { count: months });
  }

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.symbolPill}
          onPress={() => router.push(stockHref(item.symbol) as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </TouchableOpacity>
      </View>

      <AutoText style={styles.title} numberOfLines={2}>
        {getField(item, "title")}
      </AutoText>

      <Text style={styles.date}>{timeAgo(item.published_date)}</Text>
    </Card>
  );
});

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  symbolPill: {
    backgroundColor: c.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + "30",
  },
  symbolText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.primaryText,
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: c.accent,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: c.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  date: { fontSize: 12, color: c.textMuted },
});
