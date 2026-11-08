import json
from pathlib import Path

import pandas as pd
import streamlit as st

from credit_scorer import CreditScorer

ROOT = Path(__file__).parent
RESULTS = ROOT / 'results'

st.set_page_config(page_title='Credit Scoring', page_icon='💳', layout='wide')


@st.cache_resource
def load_scorer():
    return CreditScorer(str(ROOT / 'models'))


scorer = load_scorer()

st.title('💳 Credit Scoring Model')
st.caption('Predict the default risk of a client within 2 years (Give Me Some Credit dataset)')

tab_predict, tab_perf = st.tabs(['Client scoring', 'Model performance'])

# ---------------- Tab 1: prediction ----------------
with tab_predict:
    st.subheader('Client information')
    c1, c2 = st.columns(2)

    with c1:
        age = st.number_input('Age', 18, 120, 40)
        monthly_income = st.number_input('Monthly income', 0.0, 1_000_000.0, 5000.0, step=100.0)
        unknown_income = st.checkbox('Income unknown')
        dependents = st.number_input('Number of dependents', 0, 20, 0)
        open_lines = st.number_input('Open credit lines and loans', 0, 60, 6)
        real_estate = st.number_input('Real estate loans or lines', 0, 60, 1)

    with c2:
        revolving = st.number_input('Revolving utilization of unsecured lines (ratio)',
                                    0.0, 50000.0, 0.3, step=0.05)
        debt_ratio = st.number_input('Debt ratio', 0.0, 400000.0, 0.35, step=0.05)
        late_30 = st.number_input('Times 30-59 days past due', 0, 20, 0)
        late_60 = st.number_input('Times 60-89 days past due', 0, 20, 0)
        late_90 = st.number_input('Times 90+ days late', 0, 20, 0)

    if st.button('Evaluate client', type='primary'):
        client = {
            'RevolvingUtilizationOfUnsecuredLines': revolving,
            'age': age,
            'NumberOfTime30-59DaysPastDueNotWorse': late_30,
            'DebtRatio': debt_ratio,
            'MonthlyIncome': None if unknown_income else monthly_income,
            'NumberOfOpenCreditLinesAndLoans': open_lines,
            'NumberOfTimes90DaysLate': late_90,
            'NumberRealEstateLoansOrLines': real_estate,
            'NumberOfTime60-89DaysPastDueNotWorse': late_60,
            'NumberOfDependents': dependents,
        }
        out = scorer.predict(client)
        proba, thr = out['probability'], out['threshold']

        st.divider()
        m1, m2, m3 = st.columns(3)
        m1.metric('Default probability', f'{proba:.1%}')
        m2.metric('Decision threshold', f'{thr:.1%}')
        m3.metric('Decision', out['decision'])

        st.progress(min(proba, 1.0))
        if out['decision'] == 'High risk':
            st.error('High risk: the probability is above the decision threshold.')
        else:
            st.success('Low risk: the probability is below the decision threshold.')

# ---------------- Tab 2: performance ----------------
with tab_perf:
    st.subheader('Final model (Random Forest, test set)')
    metrics_file = RESULTS / 'final_metrics.json'
    if metrics_file.exists():
        m = json.loads(metrics_file.read_text())
        cols = st.columns(4)
        cols[0].metric('Precision', f"{m['precision']:.3f}")
        cols[1].metric('Recall', f"{m['recall']:.3f}")
        cols[2].metric('F1-score', f"{m['f1']:.3f}")
        cols[3].metric('ROC-AUC', f"{m['roc_auc']:.3f}")

    comparison = RESULTS / 'models_comparison.csv'
    if comparison.exists():
        st.subheader('Model comparison')
        st.dataframe(pd.read_csv(comparison), use_container_width=True, hide_index=True)

    st.subheader('Charts')
    g1, g2 = st.columns(2)
    for col, img in zip([g1, g2, g1, g2],
                        ['roc_curves.png', 'feature_importance.png',
                         'confusion_matrix.png', 'threshold_curve.png']):
        if (RESULTS / img).exists():
            col.image(str(RESULTS / img), caption=img.replace('_', ' ').replace('.png', '').title())