export interface upgradeDownGradeRecomendationSymbol {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

export interface priceTargetSymbol {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  analystName: string;
  priceTarget: number;
  priceWhenPosted: number;
  newsPublisher: string;
  analystCompany: string;
}

export interface upgradeDownGradeSymbol {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  newsPublisher: string;
  newGrade: string;
  previousGrade: string;
  gradingCompany: string;
  action: string;
  priceWhenPosted: number;
}

export interface newsRSS {
  symbol: string;
  publishedDate: string;
  title: string;
  site: string;
  text: string;
  sentiment: string;
  sentimentScore: number;
}

export interface delisted {
  symbol: string;
  companyName: string;
  exchange: string;
  ipoDate: string;
  delistedDate: string;
}
