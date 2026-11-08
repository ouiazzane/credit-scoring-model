from credit_scorer import CreditScorer

scorer = CreditScorer('models')

client = {
    'RevolvingUtilizationOfUnsecuredLines': 0.35, 'age': 45,
    'NumberOfTime30-59DaysPastDueNotWorse': 0, 'DebtRatio': 0.4,
    'MonthlyIncome': 5000, 'NumberOfOpenCreditLinesAndLoans': 8,
    'NumberOfTimes90DaysLate': 0, 'NumberRealEstateLoansOrLines': 1,
    'NumberOfTime60-89DaysPastDueNotWorse': 0, 'NumberOfDependents': 2,
}
print(scorer.predict(client))