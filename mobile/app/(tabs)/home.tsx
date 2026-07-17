import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { useOpenSignals } from "@/hooks/useSignals";
import { useNews, useBreakthroughs } from "@/hooks/useContent";
import { SignalCard } from "@/components/signals/SignalCard";
import { NewsCard } from "@/components/news/NewsCard";
import { BreakthroughCard } from "@/components/breakthroughs/BreakthroughCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Colors } from "@/constants/colors";
import { rowDirection } from "@/lib/rtl";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  const signals = useOpenSignals();
  const news = useNews();
  const breakthroughs = useBreakthroughs();

  const isRefreshing =
    signals.isRefetching || news.isRefetching || breakthroughs.isRefetching;

  function handleRefresh() {
    signals.refetch();
    news.refetch();
    breakthroughs.refetch();
  }

  const topSignals = signals.data?.pages[0]?.data.slice(0, 5) ?? [];
  const topNews = news.data?.pages[0]?.data.slice(0, 3) ?? [];
  const topBreakthroughs = breakthroughs.data?.pages[0]?.data.slice(0, 2) ?? [];

  const welcomeKey = user?.firstName ? "home.welcome_name" : "home.welcome";
  const welcomeName = user?.firstName ?? "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.appHeader, { flexDirection: rowDirection }]}>
        <View style={[styles.appHeaderLeft, { flexDirection: rowDirection }]}>
          <Image
            source={require("@/assets/icon-header.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.welcomeText}>
              {t(welcomeKey, { name: welcomeName })}
            </Text>
          </View>
        </View>
        <LanguageToggle style={styles.languageToggle} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Signals Section */}
        <SectionHeader
          title={t("home.open_signals")}
          actionLabel={t("home.view_all")}
          onAction={() => router.push("/(tabs)/signals" as never)}
        />
        {signals.isLoading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={styles.sectionLoader}
          />
        ) : topSignals.length > 0 ? (
          topSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onPress={() =>
                router.push(`/(tabs)/signals/${signal.id}` as never)
              }
            />
          ))
        ) : (
          <Text style={styles.emptyText}>{t("signals.empty")}</Text>
        )}

        {/* News Section */}
        <SectionHeader
          title={t("home.latest_news")}
          actionLabel={t("home.view_all")}
          onAction={() => router.push("/(tabs)/news" as never)}
        />
        {news.isLoading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={styles.sectionLoader}
          />
        ) : topNews.length > 0 ? (
          topNews.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>{t("news.empty")}</Text>
        )}

        {/* Breakthroughs Section */}
        <SectionHeader
          title={t("home.breakthroughs")}
          actionLabel={t("home.view_all")}
          onAction={() => router.push("/breakthroughs" as never)}
        />
        {breakthroughs.isLoading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={styles.sectionLoader}
          />
        ) : topBreakthroughs.length > 0 ? (
          topBreakthroughs.map((item) => (
            <BreakthroughCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/breakthroughs/${item.id}` as never)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>{t("breakthroughs.empty")}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  appHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  appHeaderLeft: {
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  languageToggle: { marginBottom: 0 },
  logo: { width: 44, height: 44 },
  welcomeText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  content: { padding: 16 },
  sectionLoader: { marginVertical: 16 },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
});
