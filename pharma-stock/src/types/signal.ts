export interface RawSignal {
  id: number;
  symbol: string;
  type: "Buy" | "Sell";
  enter_price: number;
  price_now: number;
  first_target: number;
  second_target: number;
  date_opened: string;
  reason_en?: string;
  reason_ar?: string;
}

export interface SignalHistory {
  id?: number;
  symbol: string;
  entrance_date: string;
  closing_date: string;
  in_price: number;
  out_price: number;
  success?: boolean;
}

export interface Signal {
  id: number; // id is a number
  symbol: string;
  type: string;
  enterPrice: number;
  priceNow: number;
  firstTarget: number;
  secondTarget: number;
  dateOpened: string;
  reason_en?: string;
  reason_ar?: string;
}
