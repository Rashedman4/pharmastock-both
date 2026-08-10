import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type {
  EliteStatus,
  EliteDashboard,
  TradePlan,
  TradePlanMessage,
  TradeExecution,
  CloseRequest,
  FirmProfitPayment,
  BankAccount,
  PortfolioData,
} from '@/types/elite';
import type { PaginatedResponse } from '@/types/content';

export async function fetchEliteStatus(): Promise<EliteStatus> {
  const { data } = await apiClient.get<EliteStatus>(API_ROUTES.elite.status);
  return data;
}

export async function applyForElite(payload: {
  phone_number: string;
  investment_amount: number;
  description?: string;
  referral_code?: string;
  agreement_accepted: boolean;
  agreement_version: string;
}): Promise<{ id: number }> {
  const { data } = await apiClient.post(API_ROUTES.elite.apply, payload);
  return data;
}

export async function fetchEliteDashboard(): Promise<EliteDashboard> {
  const { data } = await apiClient.get<EliteDashboard>(API_ROUTES.elite.dashboard);
  return data;
}

export async function fetchElitePortfolio(): Promise<PortfolioData> {
  const { data } = await apiClient.get<PortfolioData>(API_ROUTES.elite.portfolio);
  return data;
}

export async function fetchTradePlans(
  page = 1,
  limit = 20,
  status?: string
): Promise<PaginatedResponse<TradePlan>> {
  const { data } = await apiClient.get<PaginatedResponse<TradePlan>>(
    API_ROUTES.elite.tradePlans,
    { params: { page, limit, ...(status ? { status } : {}) } }
  );
  return data;
}

export async function fetchTradePlan(id: number): Promise<TradePlan> {
  const { data } = await apiClient.get<TradePlan>(API_ROUTES.elite.tradePlan(id));
  return data;
}

export async function respondToTradePlan(
  id: number,
  decision: 'ACCEPTED' | 'REJECTED',
  note?: string
): Promise<unknown> {
  const { data } = await apiClient.post(API_ROUTES.elite.tradePlanRespond(id), { decision, note });
  return data;
}

export async function fetchTradePlanMessages(id: number): Promise<{ data: TradePlanMessage[] }> {
  const { data } = await apiClient.get<{ data: TradePlanMessage[] }>(
    API_ROUTES.elite.tradePlanMessages(id)
  );
  return data;
}

export async function sendTradePlanMessage(
  id: number,
  message_text: string
): Promise<unknown> {
  const { data } = await apiClient.post(API_ROUTES.elite.tradePlanMessages(id), { message_text });
  return data;
}

export async function submitExecution(
  planId: number,
  executedQuantity: number,
  executedPrice: number,
  investorNote?: string,
  screenshot?: { uri: string; name: string; type: string } | null
): Promise<TradeExecution> {
  const form = new FormData();
  form.append('plan_id', String(planId));
  form.append('executed_quantity', String(executedQuantity));
  form.append('executed_price', String(executedPrice));
  form.append('executed_at', new Date().toISOString());
  if (investorNote) form.append('investor_note', investorNote);
  if (screenshot) {
    form.append('screenshot', {
      uri: screenshot.uri,
      name: screenshot.name,
      type: screenshot.type,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<TradeExecution>(
    API_ROUTES.elite.executions,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function fetchExecutions(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<TradeExecution>> {
  const { data } = await apiClient.get<PaginatedResponse<TradeExecution>>(
    API_ROUTES.elite.executions,
    { params: { page, limit } }
  );
  return data;
}

export async function fetchCloseRequests(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<CloseRequest>> {
  const { data } = await apiClient.get<PaginatedResponse<CloseRequest>>(
    API_ROUTES.elite.closeRequests,
    { params: { page, limit } }
  );
  return data;
}

export async function submitCloseRequest(payload: {
  position_id: number;
  requested_quantity: number;
  requested_exit_price?: number;
  request_note?: string;
  evidence?: { uri: string; name: string; type: string } | null;
  force_close?: boolean;
}): Promise<CloseRequest> {
  const form = new FormData();
  form.append('position_id', String(payload.position_id));
  form.append('requested_quantity', String(payload.requested_quantity));
  if (payload.requested_exit_price != null) {
    form.append('requested_exit_price', String(payload.requested_exit_price));
  }
  if (payload.request_note) form.append('request_note', payload.request_note);
  if (payload.force_close) form.append('force_close', 'true');
  if (payload.evidence) {
    form.append('evidence', {
      uri: payload.evidence.uri,
      name: payload.evidence.name,
      type: payload.evidence.type,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<CloseRequest>(
    API_ROUTES.elite.closeRequests,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function respondToCloseRequest(
  requestId: number,
  decision: 'ACCEPTED' | 'REJECTED',
  responseNote?: string | null,
  evidence?: { uri: string; name: string; type: string } | null,
): Promise<void> {
  const form = new FormData();
  form.append('decision', decision);
  if (responseNote) form.append('response_note', responseNote);
  if (evidence) {
    form.append('evidence', {
      uri: evidence.uri,
      name: evidence.name,
      type: evidence.type,
    } as unknown as Blob);
  }
  await apiClient.patch(
    API_ROUTES.elite.closeRequestRespond(requestId),
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

export async function fetchFirmProfitPayments(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<FirmProfitPayment>> {
  const { data } = await apiClient.get<PaginatedResponse<FirmProfitPayment>>(
    API_ROUTES.elite.firmProfitPayments,
    { params: { page, limit } }
  );
  return data;
}

export async function uploadFirmProfitProof(
  paymentId: number,
  file: {
    uri: string;
    name: string;
    type: string;
  },
  transferReference?: string,
  note?: string
): Promise<{ proof_url: string }> {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  if (transferReference) form.append('transfer_reference', transferReference);
  if (note) form.append('note', note);

  const { data } = await apiClient.post<{ proof_url: string }>(
    API_ROUTES.elite.firmProfitProof(paymentId),
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function fetchBankAccounts(): Promise<{ data: BankAccount[] }> {
  const { data } = await apiClient.get<{ data: BankAccount[] }>(API_ROUTES.elite.bankAccounts);
  return data;
}

export async function requestPaymentHandoff(): Promise<{ url: string; expires_in: number }> {
  const { data } = await apiClient.post(API_ROUTES.elite.paymentHandoff, {});
  return data;
}
