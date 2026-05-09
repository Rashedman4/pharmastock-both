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
  },
  me: '/api/mobile/v1/me',
  meLanguage: '/api/mobile/v1/me/language',
  signals: {
    list: '/api/mobile/v1/signals',
    detail: (id: number) => `/api/mobile/v1/signals/${id}`,
    history: '/api/mobile/v1/signals/history',
  },
  news: {
    list: '/api/mobile/v1/news',
    detail: (id: number) => `/api/mobile/v1/news/${id}`,
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
  elite: {
    status: '/api/mobile/v1/elite/status',
    apply: '/api/mobile/v1/elite/apply',
    dashboard: '/api/mobile/v1/elite/dashboard',
    portfolio: '/api/mobile/v1/elite/portfolio',
    tradePlans: '/api/mobile/v1/elite/trade-plans',
    tradePlan: (id: number) => `/api/mobile/v1/elite/trade-plans/${id}`,
    tradePlanRespond: (id: number) => `/api/mobile/v1/elite/trade-plans/${id}`,
    tradePlanMessages: (id: number) => `/api/mobile/v1/elite/trade-plans/${id}/messages`,
    executions: '/api/mobile/v1/elite/executions',
    closeRequests: '/api/mobile/v1/elite/close-requests',
    closeRequestRespond: (id: number) => `/api/mobile/v1/elite/close-requests/${id}`,
    firmProfitPayments: '/api/mobile/v1/elite/firm-profit-payments',
    firmProfitProof: (id: number) => `/api/mobile/v1/elite/firm-profit-payments/${id}/proof`,
    bankAccounts: '/api/mobile/v1/elite/bank-accounts',
  },
} as const;
