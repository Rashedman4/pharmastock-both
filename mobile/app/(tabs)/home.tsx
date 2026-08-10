import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Colors } from '@/constants/colors';

// Route wiring only for now — the full hero/chips/sections layout is built
// out in a follow-up commit. This keeps the tab navigable and non-crashing
// in the meantime.
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Image
          source={require('@/assets/icon-header.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <LanguageToggle style={styles.languageToggle} />
      </View>
    </SafeAreaView>
  );
}

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
});
