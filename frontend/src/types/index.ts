export interface Client {
  RevolvingUtilizationOfUnsecuredLines: number;
  age: number;
  "NumberOfTime30-59DaysPastDueNotWorse": number;
  DebtRatio: number;
  MonthlyIncome: number | null;
  NumberOfOpenCreditLinesAndLoans: number;
  NumberOfTimes90DaysLate: number;
  NumberRealEstateLoansOrLines: number;
  "NumberOfTime60-89DaysPastDueNotWorse": number;
  NumberOfDependents: number;
}

export interface TopFactor {
  feature: keyof Client;
  value: number | null;
  neutral_value: number | null;
  effect: number;
  importance: number;
  direction: "increases" | "decreases";
}

export interface Prediction {
  probability: number;
  threshold: number;
  decision: "High risk" | "Low risk";
  risk_level: "Low" | "Medium" | "High" | "Very high";
  top_factors: TopFactor[];
}

export interface Metrics {
  model: string;
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
}

export interface ComparisonRow {
  Model: string;
  Precision: number;
  Recall: number;
  F1: number;
  "ROC-AUC": number;
}

export interface ImportanceRow {
  feature: string;
  importance: number;
}

export interface Evaluation {
  id: string;
  date: string;
  client: Client;
  probability: number;
  decision: Prediction["decision"];
  riskLevel: Prediction["risk_level"];
}
