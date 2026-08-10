export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const API_ROUTES = {
  auth: {
    login: '/api/mobile/v1/auth/login',
    register: '/api/mobile/v1/auth/register',
    verify: '/api/mobile/v1/auth/verify',
    refresh: '/api/mobile/v1/auth/refresh',
    logout: '/api/mobile/v1/auth/logout',
    forgotPassword: '/api/mobile/v1/auth/forgot-password',
    resetPassword: '/api/mobile/v1/auth/reset-password',
    googleLogin: '/api/mobile/v1/auth/google',
    appleLogin: '/api/mobile/v1/auth/apple',
  },
  me: '/api/mobile/v1/me',
  meLanguage: '/api/mobile/v1/me/language',
  news: {
    list: '/api/mobile/v1/news',
    detail: (id: number) => `/api/mobile/v1/news/${id}`,
  },
  dailyUpdates: {
    list: '/api/mobile/v1/daily-updates',
    detail: (id: number) => `/api/mobile/v1/daily-updates/${id}`,
  },
  breakthroughs: {
    list: '/api/mobile/v1/breakthroughs',
    detail: (id: number) => `/api/mobile/v1/breakthroughs/${id}`,
  },
  market: {
    price: (symbol: string) => `/api/mobile/v1/market/${symbol}`,
  },
  pushToken: '/api/mobile/v1/push-token',
  notifications: {
    list: '/api/mobile/v1/notifications',
    unreadCount: '/api/mobile/v1/notifications/unread-count',
    read: (id: string) => `/api/mobile/v1/notifications/${id}/read`,
    readAll: '/api/mobile/v1/notifications/read-all',
  },
  chat: {
    conversations: '/api/mobile/v1/chat/conversations',
    messages: (conversationId: string) =>
      `/api/mobile/v1/chat/conversations/${conversationId}/messages`,
    markRead: (messageId: string) =>
      `/api/mobile/v1/chat/messages/${messageId}/read`,
    upload: '/api/mobile/v1/uploads/chat',
  },
} as const;
