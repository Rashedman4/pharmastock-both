import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { StockDetail, StockSummary } from '@/types/content';

/** Searches the covered universe. An uncovered ticker simply has no match. */
export async function searchStocks(q: string): Promise<StockSummary[]> {
  const { data } = await apiClient.get<{ data: StockSummary[] }>(
    API_ROUTES.stocks.search,
    { params: { q } }
  );
  return data.data;
}

export async function fetchStockDetail(symbol: string): Promise<StockDetail> {
  const { data } = await apiClient.get<StockDetail>(
    API_ROUTES.stocks.detail(symbol)
  );
  return data;
}
