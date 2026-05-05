import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { PaginatedResponse, NewsItem } from '@/types/content';

export async function fetchNews(page = 1, limit = 20): Promise<PaginatedResponse<NewsItem>> {
  const { data } = await apiClient.get<PaginatedResponse<NewsItem>>(API_ROUTES.news.list, {
    params: { page, limit },
  });
  return data;
}

export async function fetchNewsItem(id: number): Promise<NewsItem> {
  const { data } = await apiClient.get<NewsItem>(API_ROUTES.news.detail(id));
  return data;
}
