import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import { useNews, useBreakthroughs } from '@/hooks/useContent';
import { NewsCard } from '@/components/news/NewsCard';
import { BreakthroughCard } from '@/components/breakthroughs/BreakthroughCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
import type { NewsItem, Breakthrough } from '@/types/content';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isRTL } = useRTL();

  const news = useNews();
  const breakthroughs = useBreakthroughs();

  const isRefreshing = news.isRefetching || breakthroughs.isRefetching;

  function handleRefresh() {
    news.refetch();
    breakthroughs.refetch();
  }

  const topNews: NewsItem[] = news.data?.pages[0]?.data.slice(0, 3) ?? [];
  const topBreakthroughs: Breakthrough[] =
    breakthroughs.data?.pages[0]?.data.slice(0, 3) ?? [];

  const welcomeKey = user?.firstName ? 'home.welcome_name' : 'home.welcome';
  const welcomeName = user?.firstName ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appBar}>
        <Image
          source={require('@/assets/icon-header.png')}
          style={styles.logo}
          contentFit="contain"
        />
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
        {/* Hero — the wrapper carries the shadow (overflow: hidden on the
            same view would clip it), the inner card carries the gradient,
            flourish, and text and clips the flourish to its rounded corners. */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroFlourish, isRTL && styles.heroFlourishRTL]} />
            <View style={styles.heroContent}>
              <Text style={styles.heroGreeting}>
                {t(welcomeKey, { name: welcomeName })}
              </Text>
              <Text style={styles.heroTagline}>{t('home.tagline')}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {t('home.hero_subtitle')}
              </Text>
            </View>
          </View>
        </View>

        {/* Explore row */}
        <View style={styles.exploreRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => router.push('/(tabs)/news')}
            activeOpacity={0.7}
          >
            <View style={styles.chipIconBox}>
              <Ionicons name="newspaper-outline" size={16} color={Colors.accent} />
            </View>
            <Text style={styles.chipLabel}>{t('home.explore_news')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => router.push('/(tabs)/breakthroughs')}
            activeOpacity={0.7}
          >
            <View style={styles.chipIconBox}>
              <Ionicons name="flask-outline" size={16} color={Colors.accent} />
            </View>
            <Text style={styles.chipLabel}>{t('home.explore_science')}</Text>
          </TouchableOpacity>
        </View>

        {/* Latest News */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.latest_news')}
            actionLabel={t('home.view_all')}
            onAction={() => router.push('/(tabs)/news')}
          />
          {news.isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
          ) : topNews.length > 0 ? (
            topNews.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/(tabs)/news/${item.id}` as never)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t('news.empty')}</Text>
          )}
        </View>

        {/* Breakthroughs */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.breakthroughs')}
            actionLabel={t('home.view_all')}
            onAction={() => router.push('/(tabs)/breakthroughs')}
          />
          {breakthroughs.isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
          ) : topBreakthroughs.length > 0 ? (
            topBreakthroughs.map((item) => (
              <BreakthroughCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/(tabs)/breakthroughs/${item.id}` as never)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t('breakthroughs.empty')}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const HERO_FLOURISH_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  logo: { width: 44, height: 44 },
  languageToggle: { marginBottom: 0 },
  content: { padding: 16, paddingBottom: 32 },

  // Hero
  heroWrapper: {
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroFlourish: {
    position: 'absolute',
    top: -50,
    right: -70,
    width: HERO_FLOURISH_SIZE,
    height: HERO_FLOURISH_SIZE,
    borderRadius: HERO_FLOURISH_SIZE / 2,
    backgroundColor: Colors.accent,
    opacity: 0.08,
  },
  heroFlourishRTL: {
    right: undefined,
    left: -70,
  },
  heroContent: { padding: 24 },
  heroGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.softMint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTagline: {
    fontSize: 27,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
  },

  // Explore row
  exploreRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Sections
  section: { marginTop: 20 },
  sectionLoader: { marginVertical: 16 },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
