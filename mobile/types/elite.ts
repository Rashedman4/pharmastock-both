export interface EliteStatus {
  has_application: boolean;
  application_status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  application_date: string | null;
  admin_response: string | null;
  is_elite_member: boolean;
  elite_status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | null;
  approved_at: string | null;
  current_capital_amount: string | null;
}

export interface EliteDashboard {
  memberId: number;
  currentCapitalAmount: number;
  freeCapitalAmount: number;
  moneyInMarket: number;
  totalEquity: number;
  overallProfit: number;
  firmProfit: number;
  investorProfit: number;
  feeNotice: string;
  pendingPlans: number;
  executedPlans: number;
  openPositions: number;
  closedPositions: number;
  linkedPartnerName: string | null;
}

export interface TradePlan {
  id: number;
  portfolio_id: number;
  created_by_admin_id: number;
  symbol: string;
  company_name: string | null;
  plan_side: 'LONG' | 'SHORT';
  reference_market_price: string | null;
  target_entry_price: string | null;
  target_price_1: string | null;
  target_price_2: string | null;
  stop_loss_price: string | null;
  suggested_quantity: string;
  planned_at: string;
  admin_note: string | null;
  investor_decision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  investor_note: string | null;
  investor_responded_at: string | null;
  status: 'DRAFT' | 'SENT' | 'REJECTED_BY_INVESTOR' | 'ACCEPTED_BY_INVESTOR' | 'EXECUTED' | 'CANCELLED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  // Joined from trade_executions
  execution_id: number | null;
  executed_quantity: string | null;
  executed_price: string | null;
  executed_at: string | null;
  execution_status: string | null;
  screenshot_url: string | null;
  // Joined from portfolio_positions_simple
  position_id: number | null;
  quantity_open: string | null;
  entry_price: string | null;
  position_status: string | null;
  opened_at: string | null;
}

export interface TradePlanMessage {
  id: number;
  trade_plan_id: number;
  sender_user_id: number;
  sender_role: 'ADMIN' | 'INVESTOR';
  message_text: string;
  created_at: string;
  firstname: string | null;
  lastname: string | null;
}

export interface TradeExecution {
  id: number;
  trade_plan_id: number;
  portfolio_id: number;
  executed_quantity: string;
  executed_price: string;
  executed_at: string;
  screenshot_url: string | null;
  screenshot_name: string | null;
  investor_note: string | null;
  status: 'SUBMITTED' | 'OPENED' | 'CANCELLED';
  created_at: string;
  // Joined
  symbol: string;
  company_name: string | null;
  plan_side: 'LONG' | 'SHORT';
  target_price_1: string | null;
  target_price_2: string | null;
  stop_loss_price: string | null;
}

export interface CloseRequest {
  id: number;
  position_id: number;
  initiated_by_user_id: number;
  initiated_by_role: 'ADMIN' | 'INVESTOR';
  requested_quantity: string;
  requested_exit_price: string | null;
  request_note: string | null;
  evidence_url: string | null;
  evidence_name: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXECUTED';
  responded_by_user_id: number | null;
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
  // Joined
  symbol: string;
  side: string;
  quantity_open: string;
  entry_price: string;
  position_status: string;
  company_name: string | null;
}

export interface FirmProfitPayment {
  id: number;
  elite_member_id: number;
  portfolio_id: number;
  investor_user_id: number;
  currency: string;
  amount_requested: string;
  amount_paid: string;
  status: string;
  payment_method: 'STRIPE' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  bank_account_id: number | null;
  proof_url: string | null;
  proof_name: string | null;
  submitted_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  // Joined from firm_bank_accounts
  bank_name: string | null;
  iban: string | null;
  account_name: string | null;
  swift_code: string | null;
  instructions: string | null;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  iban: string;
  swift_code: string | null;
  currency: string;
  country: string | null;
  instructions: string | null;
}

// Portfolio data (camelCase — from ProgramService.getInvestorPortfolio)
export interface OpenPosition {
  id: number;
  symbol: string;
  quantityOpen: number;
  entryPrice: number;
  currentPrice: number;
  investedAmount: number;
  marketValue: number;
  unrealizedProfit: number;
  openedAt: string;
  status: string;
  targetPrice1: number | null;
  targetPrice2: number | null;
  stopLossPrice: number | null;
}

export interface PortfolioCloseRequest {
  id: number;
  positionId: number;
  initiatedByRole: 'ADMIN' | 'INVESTOR';
  requestedQuantity: number;
  requestedExitPrice: number | null;
  requestNote: string | null;
  evidenceUrl: string | null;
  evidenceName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXECUTED';
  responseNote: string | null;
  createdAt: string;
  symbol?: string;
}

export interface Closure {
  id: number;
  symbol: string;
  closedQuantity: number;
  exitPrice: number;
  realizedProfitAmount: number;
  firmShareAmount: number;
  firmPaidAmount: number;
  partnerShareAmount: number;
  evidenceUrl: string | null;
  evidenceName: string | null;
  closedAt: string;
}

export interface PortfolioSummary {
  freeCapitalAmount: number;
  moneyInMarket: number;
  totalEquity: number;
  overallProfit: number;
  firmProfit: number;
  investorProfit: number;
  firmProfitPaid: number;
  firmProfitOutstanding: number;
}

export interface PortfolioData {
  currentCapitalAmount: number;
  openPositions: OpenPosition[];
  closeRequests: PortfolioCloseRequest[];
  closures: Closure[];
  summary: PortfolioSummary;
}
