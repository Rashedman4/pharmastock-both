import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications.service';

const KEYS = {
  list: ['notifications'],
  unreadCount: ['notifications', 'unread-count'],
};

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: KEYS.list,
    queryFn: ({ pageParam = 1 }) => fetchNotifications(pageParam as number, 20),
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount,
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
    select: (data) => data.count,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });
}
