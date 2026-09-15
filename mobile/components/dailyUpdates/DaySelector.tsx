import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRTL } from '@/lib/rtl';
import {
  DAY_STRIP_LENGTH,
  MAX_HISTORY_DAYS,
  addDays,
  daysBetween,
  daysInMonth,
  firstWeekdayOfMonth,
  parseKey,
  recentDays,
  toKey,
  todayKey,
} from '@/lib/day';

interface DaySelectorProps {
  /** Currently selected day, YYYY-MM-DD. */
  value: string;
  onChange: (day: string) => void;
  /** Days that have at least one update; undefined while still loading. */
  availableDates?: Set<string>;
}

/** Label for a day chip: "Today" / "Yesterday" / localized "Sep 13". */
function useDayLabel() {
  const { t } = useTranslation();
  const today = todayKey();

  return (key: string): string => {
    if (key === today) return t('dailyUpdates.today');
    if (key === addDays(today, -1)) return t('dailyUpdates.yesterday');
    const { month, day } = parseKey(key);
    // Digits stay Western per lib/format.ts; only the month word is localized,
    // and day_month carries the per-language word order.
    return t('dailyUpdates.day_month', {
      month: t(`dailyUpdates.months_short.${month}`),
      day: String(day),
    });
  };
}

/**
 * Day picker for the Daily Updates feed: a strip of the most recent days plus a
 * calendar for anything older.
 *
 * The calendar is a plain View/Text month grid rather than a native picker, so
 * it adds no native dependency to a shipped app and it mirrors for free under
 * RTL — every row is a normal `flexDirection: 'row'` and React Native's own
 * auto-mirroring reverses it, per lib/rtl.ts. Nothing here flips direction by
 * hand.
 */
export function DaySelector({ value, onChange, availableDates }: DaySelectorProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const labelFor = useDayLabel();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = todayKey();
  const earliest = addDays(today, -(MAX_HISTORY_DAYS - 1));
  const days = useMemo(() => recentDays(DAY_STRIP_LENGTH, today), [today]);

  // A day older than the strip, reached through the calendar, still needs a
  // visible chip — otherwise the selection would look like nothing is selected.
  const stripDays = days.includes(value) ? days : [value, ...days];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {stripDays.map((day) => {
          const selected = day === value;
          const empty = availableDates ? !availableDates.has(day) : false;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onChange(day)}
            >
              <Text
                style={[
                  styles.chipText,
                  empty && !selected && styles.chipTextEmpty,
                  selected && styles.chipTextActive,
                ]}
              >
                {labelFor(day)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.calendarBtn}
        onPress={() => setCalendarOpen(true)}
        accessibilityLabel={t('dailyUpdates.pick_date')}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>

      <CalendarModal
        visible={calendarOpen}
        value={value}
        today={today}
        earliest={earliest}
        isRTL={isRTL}
        availableDates={availableDates}
        onClose={() => setCalendarOpen(false)}
        onSelect={(day) => {
          setCalendarOpen(false);
          onChange(day);
        }}
      />
    </View>
  );
}

interface CalendarModalProps {
  visible: boolean;
  value: string;
  today: string;
  earliest: string;
  isRTL: boolean;
  availableDates?: Set<string>;
  onClose: () => void;
  onSelect: (day: string) => void;
}

function CalendarModal({
  visible,
  value,
  today,
  earliest,
  isRTL,
  availableDates,
  onClose,
  onSelect,
}: CalendarModalProps) {
  const { t } = useTranslation();
  const selectedParts = parseKey(value);
  const [cursor, setCursor] = useState({
    year: selectedParts.year,
    month: selectedParts.month,
  });

  // Re-anchor on the selected month each time the sheet opens, so reopening
  // after picking an old day doesn't land on a stale month.
  React.useEffect(() => {
    if (visible) setCursor({ year: selectedParts.year, month: selectedParts.month });
  }, [visible, selectedParts.year, selectedParts.month]);

  const cells = useMemo(() => {
    const lead = firstWeekdayOfMonth(cursor.year, cursor.month);
    const total = daysInMonth(cursor.year, cursor.month);
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= total; d++) out.push(toKey(cursor.year, cursor.month, d));
    return out;
  }, [cursor]);

  const step = (delta: number) => {
    const next = cursor.month + delta;
    if (next < 1) setCursor({ year: cursor.year - 1, month: 12 });
    else if (next > 12) setCursor({ year: cursor.year + 1, month: 1 });
    else setCursor({ year: cursor.year, month: next });
  };

  // Ionicons are not bidi-mirrored by the OS, so the earlier/later chevrons are
  // swapped by hand here — the exception lib/rtl.ts calls out.
  const prevIcon = isRTL ? 'chevron-forward' : 'chevron-back';
  const nextIcon = isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={() => step(-1)} style={styles.navBtn}>
              <Ionicons name={prevIcon} size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>
              {t('dailyUpdates.month_year', {
                month: t(`dailyUpdates.months_long.${cursor.month}`),
                year: String(cursor.year),
              })}
            </Text>
            <TouchableOpacity onPress={() => step(1)} style={styles.navBtn}>
              <Ionicons name={nextIcon} size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {[0, 1, 2, 3, 4, 5, 6].map((w) => (
              <Text key={w} style={styles.weekLabel}>
                {t(`dailyUpdates.weekdays_short.${w}`)}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((key, i) => {
              if (key === null) return <View key={`pad-${i}`} style={styles.cell} />;
              const outOfRange = daysBetween(earliest, key) < 0 || daysBetween(key, today) < 0;
              const selected = key === value;
              const empty = availableDates ? !availableDates.has(key) : false;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.cell, selected && styles.cellSelected]}
                  disabled={outOfRange}
                  onPress={() => onSelect(key)}
                >
                  <Text
                    style={[
                      styles.cellText,
                      outOfRange && styles.cellTextDisabled,
                      empty && !outOfRange && !selected && styles.cellTextEmpty,
                      selected && styles.cellTextSelected,
                    ]}
                  >
                    {parseKey(key).day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  strip: { alignItems: 'center', paddingVertical: 2 },
  // Mirrors the filter chips in app/(tabs)/breakthroughs/index.tsx.
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginEnd: 8,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  chipTextEmpty: { color: Colors.textMuted },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 4,
    backgroundColor: Colors.backgroundSecondary,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: Colors.primary, borderRadius: 100 },
  cellText: { fontSize: 14, color: Colors.textPrimary },
  cellTextSelected: { color: Colors.white, fontWeight: '700' },
  cellTextDisabled: { color: Colors.borderLight },
  cellTextEmpty: { color: Colors.textMuted },
  closeBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  closeText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
