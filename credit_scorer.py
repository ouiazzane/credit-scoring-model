import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

LATE_COLS = ['NumberOfTime30-59DaysPastDueNotWorse',
             'NumberOfTimes90DaysLate',
             'NumberOfTime60-89DaysPastDueNotWorse']


class CreditScorer:
    """Loads the trained model and scores a single client (dict of raw features)."""

    def __init__(self, models_dir='models'):
        d = Path(models_dir)
        self.model = joblib.load(d / 'random_forest_final.joblib')
        with open(d / 'preprocessing_params.json') as f:
            self.p = json.load(f)

    def _prepare(self, client):
        p = self.p
        d = dict(client)

        if not (18 <= d['age'] <= 120):
            raise ValueError('age must be between 18 and 120')

        income = d.get('MonthlyIncome')
        missing = income is None or pd.isna(income)
        d['IncomeMissing'] = int(missing)
        d['MonthlyIncome'] = p['income_median'] if missing else income

        dependents = d.get('NumberOfDependents')
        d['NumberOfDependents'] = 0 if dependents is None or pd.isna(dependents) else dependents

        for c in LATE_COLS:
            if d[c] >= 96:
                d[c] = p['late_medians'][c]

        for c, cap in p['caps'].items():
            d[c] = min(d[c], cap)

        d['TotalPastDue'] = sum(d[c] for c in LATE_COLS)
        d['HasPastDue'] = int(d['TotalPastDue'] > 0)
        d['IncomePerPerson'] = d['MonthlyIncome'] / (d['NumberOfDependents'] + 1)
        d['DebtToIncome'] = d['DebtRatio'] * d['MonthlyIncome']
        d['LogIncome'] = float(np.log1p(d['MonthlyIncome']))
        d['AgeGroup'] = int(pd.cut([d['age']], bins=[17, 30, 45, 60, 120], labels=False)[0])

        return pd.DataFrame([d])[p['feature_order']]

    def predict(self, client):
        X = self._prepare(client)
        proba = float(self.model.predict_proba(X)[0, 1])
        threshold = self.p['threshold']
        return {
            'probability': proba,
            'threshold': threshold,
            'decision': 'High risk' if proba >= threshold else 'Low risk',
        }
