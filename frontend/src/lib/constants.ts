import type { Client } from "../types";

export const DEFAULT_CLIENT: Client = {
  RevolvingUtilizationOfUnsecuredLines: 0.3,
  age: 42,
  "NumberOfTime30-59DaysPastDueNotWorse": 0,
  DebtRatio: 0.4,
  MonthlyIncome: 5400,
  NumberOfOpenCreditLinesAndLoans: 8,
  NumberOfTimes90DaysLate: 0,
  NumberRealEstateLoansOrLines: 1,
  "NumberOfTime60-89DaysPastDueNotWorse": 0,
  NumberOfDependents: 1,
};

export const FIELD_INFO: Record<keyof Client, {
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  integer?: boolean;
}> = {
  age: { label: "Age", description: "The client's age in years.", min: 18, max: 120, step: 1, integer: true },
  NumberOfDependents: { label: "Dependents", description: "How many people depend on the client's income.", min: 0, max: 20, step: 1, integer: true },
  MonthlyIncome: { label: "Monthly income", description: "Approximate monthly income before tax.", min: 0, max: 30000, step: 100 },
  DebtRatio: { label: "Debt ratio", description: "Monthly debt payments divided by monthly income.", min: 0, max: 2, step: 0.01 },
  RevolvingUtilizationOfUnsecuredLines: { label: "Credit utilization", description: "Used revolving credit divided by the available limit.", min: 0, max: 1, step: 0.01 },
  NumberOfOpenCreditLinesAndLoans: { label: "Open credit lines", description: "The number of open loans and credit lines.", min: 0, max: 60, step: 1, integer: true },
  NumberRealEstateLoansOrLines: { label: "Real-estate loans", description: "Open mortgage or real-estate credit accounts.", min: 0, max: 60, step: 1, integer: true },
  "NumberOfTime30-59DaysPastDueNotWorse": { label: "30–59 days late", description: "Times a payment was 30 to 59 days overdue.", min: 0, max: 20, step: 1, integer: true },
  "NumberOfTime60-89DaysPastDueNotWorse": { label: "60–89 days late", description: "Times a payment was 60 to 89 days overdue.", min: 0, max: 20, step: 1, integer: true },
  NumberOfTimes90DaysLate: { label: "90+ days late", description: "Times a payment was at least 90 days overdue.", min: 0, max: 20, step: 1, integer: true },
};

export const PRESETS: Record<string, Client> = {
  "Safe client": { ...DEFAULT_CLIENT, age: 48, RevolvingUtilizationOfUnsecuredLines: 0.12, DebtRatio: 0.18, MonthlyIncome: 8500, NumberOfOpenCreditLinesAndLoans: 10 },
  "Average client": { ...DEFAULT_CLIENT, age: 42, RevolvingUtilizationOfUnsecuredLines: 0.42, DebtRatio: 0.55, MonthlyIncome: 5200, NumberOfOpenCreditLinesAndLoans: 7, "NumberOfTime30-59DaysPastDueNotWorse": 1 },
  "Risky client": { ...DEFAULT_CLIENT, age: 34, RevolvingUtilizationOfUnsecuredLines: 0.92, DebtRatio: 1.2, MonthlyIncome: 2600, NumberOfOpenCreditLinesAndLoans: 4, "NumberOfTime30-59DaysPastDueNotWorse": 4, NumberOfTimes90DaysLate: 2, "NumberOfTime60-89DaysPastDueNotWorse": 2 },
};

export const CHARTS = [
  { title: "ROC curves", file: "roc_curves.png", subtitle: "Model discrimination across thresholds" },
  { title: "Feature importance", file: "feature_importance.png", subtitle: "Signals with the strongest influence" },
  { title: "Confusion matrix", file: "confusion_matrix.png", subtitle: "Correct and incorrect classifications" },
  { title: "Threshold analysis", file: "threshold_curve.png", subtitle: "Precision and recall trade-off" },
];
