import React, { useMemo } from 'react';
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
import { useWatchlist, useRemoveFromWatchlist } from '@/hooks/useStocks';
import { StockRow } from '@/components/stocks/StockRow';
import { NewsCard } from '@/components/news/NewsCard';
import { BreakthroughCard } from '@/components/breakthroughs/BreakthroughCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { AutoText } from '@/components/ui/AutoText';
import type { AppColors } from '@/constants/colors';
import { useTheme } from '@/lib/theme';
import { useRTL } from '@/lib/rtl';
import { useLocalizedField } from '@/lib/i18n-content';
import { stockHref } from '@/lib/stockLink';
import type { NewsItem, Breakthrough } from '@/types/content';

export default function HomeScreen() {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isRTL } = useRTL();

  const getField = useLocalizedField();

  const news = useNews();
  const breakthroughs = useBreakthroughs();
  const watchlist = useWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const isRefreshing =
    news.isRefetching || breakthroughs.isRefetching || watchlist.isRefetching;

  function handleRefresh() {
    news.refetch();
    breakthroughs.refetch();
    watchlist.refetch();
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
          // The navy strands of the default mark disappear against the dark
          // app bar, so dark mode uses a light-stroke variant of the same
          // artwork. Same dimensions, so nothing about the layout changes.
          source={
            scheme === 'dark'
              ? require('@/assets/icon-header-dark.png')
              : require('@/assets/icon-header.png')
          }
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
            tintColor={colors.primaryText}
            colors={[colors.primaryText]}
          />
        }
      >
        {/* Hero — the wrapper carries the shadow (overflow: hidden on the
            same view would clip it), the inner card carries the gradient,
            flourish, and text and clips the flourish to its rounded corners. */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroCard}>
            <LinearGradient
              // Dark mode gets its own pair: the light gradient's navy-on-navy
              // would glow against a dark page, and the dark `primary` is a
              // fill colour rather than the light scheme's text navy.
              colors={
                scheme === 'dark'
                  ? [colors.backgroundTertiary, colors.primary]
                  : [colors.primary, colors.primaryLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroFlourish, isRTL && styles.heroFlourishRTL]} />
            <View style={styles.heroContent}>
              <AutoText style={styles.heroGreeting}>
                {t(welcomeKey, { name: welcomeName })}
              </AutoText>
              <AutoText style={styles.heroTagline}>{t('home.tagline')}</AutoText>
              <AutoText style={styles.heroSubtitle} numberOfLines={2}>
                {t('home.hero_subtitle')}
              </AutoText>
            </View>
          </View>
        </View>

        {/* Stock search — the entry point to the search screen, which is a
            stack screen rather than a seventh tab. */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/stocks/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t('home.search_placeholder')}</Text>
        </TouchableOpacity>

        {/* Explore row */}
        <View style={styles.exploreRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => router.push('/(tabs)/news')}
            activeOpacity={0.7}
          >
            <View style={styles.chipIconBox}>
              <Ionicons name="newspaper-outline" size={16} color={colors.accent} />
            </View>
            <Text style={styles.chipLabel}>{t('home.explore_news')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => router.push('/(tabs)/breakthroughs')}
            activeOpacity={0.7}
          >
            <View style={styles.chipIconBox}>
              <Ionicons name="flask-outline" size={16} color={colors.accent} />
            </View>
            <Text style={styles.chipLabel}>{t('home.explore_science')}</Text>
          </TouchableOpacity>
        </View>

        {/* My watchlist */}
        <View style={styles.section}>
          <SectionHeader title={t('watchlist.title')} />
          {watchlist.isLoading ? (
            <ActivityIndicator color={colors.primaryText} style={styles.sectionLoader} />
          ) : (watchlist.data?.length ?? 0) > 0 ? (
            watchlist.data?.map((entry) => (
              <StockRow
                key={entry.symbol}
                symbol={entry.symbol}
                name={getField(entry, 'name')}
                price={entry.price}
                isWatched
                onPress={() => router.push(stockHref(entry.symbol) as never)}
                onToggleWatch={() =>
                  removeFromWatchlist.mutate({ symbol: entry.symbol })
                }
                disabled={removeFromWatchlist.isPending}
              />
            ))
          ) : (
            <View style={styles.watchlistEmpty}>
              <Text style={styles.emptyText}>{t('watchlist.empty')}</Text>
              <TouchableOpacity onPress={() => router.push('/stocks/search')}>
                <Text style={styles.watchlistEmptyAction}>
                  {t('watchlist.search_cta')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Latest News */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.latest_news')}
            actionLabel={t('home.view_all')}
            onAction={() => router.push('/(tabs)/news')}
          />
          {news.isLoading ? (
            <ActivityIndicator color={colors.primaryText} style={styles.sectionLoader} />
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
            <ActivityIndicator color={colors.primaryText} style={styles.sectionLoader} />
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

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.backgroundSecondary },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: c.surface,
  },
  logo: { width: 44, height: 44 },
  languageToggle: { marginBottom: 0 },
  content: { padding: 16, paddingBottom: 32 },

  // Hero
  heroWrapper: {
    borderRadius: 20,
    shadowColor: c.primary,
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
    backgroundColor: c.accent,
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
    color: c.softMint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTagline: {
    fontSize: 27,
    fontWeight: '800',
    color: c.white,
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
  },

  // Stock search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 16,
  },
  searchPlaceholder: { fontSize: 14, color: c.textMuted },

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
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textPrimary,
  },

  // Sections
  section: { marginTop: 20 },
  watchlistEmpty: { alignItems: 'center', paddingVertical: 8 },
  watchlistEmptyAction: {
    fontSize: 13,
    fontWeight: '600',
    color: c.accent,
    marginTop: 6,
  },
  sectionLoader: { marginVertical: 16 },
  emptyText: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
