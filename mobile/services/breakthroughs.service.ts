import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { PaginatedResponse, Breakthrough, MarketPrice } from '@/types/content';

export interface BreakthroughFilters {
  category?: string;
  stage?: string;
}

export async function fetchBreakthroughs(
  page = 1,
  limit = 20,
  filters?: BreakthroughFilters
): Promise<PaginatedResponse<Breakthrough>> {
  const { data } = await apiClient.get<PaginatedResponse<Breakthrough>>(
    API_ROUTES.breakthroughs.list,
    { params: { page, limit, ...filters } }
  );
  return data;
}

export async function fetchBreakthrough(id: number): Promise<Breakthrough> {
  const { data } = await apiClient.get<Breakthrough>(API_ROUTES.breakthroughs.detail(id));
  return data;
}

export async function fetchMarketPrice(symbol: string): Promise<MarketPrice> {
  const { data } = await apiClient.get<MarketPrice>(API_ROUTES.market.price(symbol));
  return data;
}
