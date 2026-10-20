/**
 * The one place that knows the stock page's path.
 *
 * Every symbol chip on a news / daily-update / breakthrough / announcement
 * card or detail screen taps through to here.
 */
export function stockHref(symbol: string): string {
  return `/stock/${encodeURIComponent(symbol.trim().toUpperCase())}`;
}
