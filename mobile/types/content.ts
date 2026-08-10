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
