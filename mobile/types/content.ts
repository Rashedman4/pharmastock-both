export interface NewsItem {
  id: number;
  title_en: string;
  title_ar: string;
  price: string | null;
  symbol: string;
  published_date: string;
}

export interface DailyUpdateItem {
  id: number;
  symbol: string;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  description_en: string;
  description_ar: string;
  published_date: string;
}

/** One day that has at least one daily update, from /daily-updates/available-dates. */
export interface AvailableDate {
  /** YYYY-MM-DD in the backend's canonical timezone. */
  date: string;
  count: number;
}

export interface Breakthrough {
  id: number;
  title_en: string;
  title_ar: string;
  company: string;
  symbol: string;
  description_en: string;
  description_ar: string;
  potential_impact_en: string;
  potential_impact_ar: string;
  category: 'drug' | 'therapy' | 'device';
  stage: 'research' | 'clinical' | 'approved';
  created_at: string;
}

export interface MarketPrice {
  symbol: string;
  current_price: string;
  previous_close_price: string | null;
  change_amount: string | null;
  change_percent: string | null;
  market_status: string;
  currency: string;
  fetched_at: string;
}

/** A stock in the covered universe (US biopharma only). */
export interface StockSummary {
  symbol: string;
  name_en: string;
  name_ar: string | null;
}

/** Cached price for a symbol. Null everywhere when the symbol has no cache row. */
export interface CachedPrice {
  current_price: string | null;
  previous_close_price: string | null;
  change_amount: string | null;
  change_percent: string | null;
  currency: string | null;
  market_status: string | null;
  fetched_at: string | null;
}

export interface AnnouncementSummary {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  source_url: string | null;
  announced_at: string | null;
  published_date: string;
}

export interface AnnouncementDetail extends AnnouncementSummary {
  /** Markdown. `_en` is the verbatim original, `_ar` the translation. */
  content_en: string;
  content_ar: string;
  stock_name_en: string | null;
  stock_name_ar: string | null;
}

/** The stock page payload: one round trip for everything on screen. */
export interface StockDetail extends StockSummary {
  is_active: boolean;
  price: CachedPrice | null;
  is_watched: boolean;
  alerts_enabled: boolean;
  announcements: AnnouncementSummary[];
  daily_updates: Pick<
    DailyUpdateItem,
    'id' | 'symbol' | 'subtitle_en' | 'subtitle_ar' | 'published_date'
  >[];
  breakthroughs: Pick<
    Breakthrough,
    'id' | 'symbol' | 'title_en' | 'title_ar' | 'category' | 'stage' | 'created_at'
  >[];
  news: Pick<
    NewsItem,
    'id' | 'symbol' | 'title_en' | 'title_ar' | 'price' | 'published_date'
  >[];
}

export interface WatchlistEntry extends StockSummary {
  alerts_enabled: boolean;
  created_at: string;
  price: CachedPrice | null;
}

export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'admin' | 'user';
  senderId: number | null;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'file';
  content: string | null;
  attachmentUrl: string | null;
  attachmentMetadata: Record<string, unknown>;
  broadcastCampaignId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  adminUnreadCount: number;
  userUnreadCount: number;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
