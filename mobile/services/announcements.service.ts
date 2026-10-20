import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type {
  AnnouncementDetail,
  AnnouncementSummary,
  PaginatedResponse,
} from '@/types/content';

export async function fetchAnnouncements(
  page = 1,
  limit = 20,
  symbol?: string
): Promise<PaginatedResponse<AnnouncementSummary>> {
  const { data } = await apiClient.get<PaginatedResponse<AnnouncementSummary>>(
    API_ROUTES.announcements.list,
    { params: { page, limit, ...(symbol ? { symbol } : {}) } }
  );
  return data;
}

export async function fetchAnnouncement(id: number): Promise<AnnouncementDetail> {
  const { data } = await apiClient.get<AnnouncementDetail>(
    API_ROUTES.announcements.detail(id)
  );
  return data;
}
