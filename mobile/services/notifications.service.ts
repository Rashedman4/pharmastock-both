import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { InAppNotification, PaginatedResponse } from '@/types/content';

export async function fetchNotifications(page = 1, limit = 20): Promise<PaginatedResponse<InAppNotification>> {
  const { data } = await apiClient.get(API_ROUTES.notifications.list, {
    params: { page, limit },
  });
  return data;
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get(API_ROUTES.notifications.unreadCount);
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(API_ROUTES.notifications.read(id));
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch(API_ROUTES.notifications.readAll);
}
