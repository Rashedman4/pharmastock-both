import { router } from 'expo-router';
import type { Href } from 'expo-router';

/**
 * Pops the navigation stack when there is history to pop, otherwise replaces
 * the current route with `fallback`. Prevents the no-op + dev warning that
 * occurs when a screen is entered directly via deep link or push notification.
 */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
