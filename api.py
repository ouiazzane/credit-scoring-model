import csv
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from credit_scorer import CreditScorer

ROOT = Path(__file__).resolve().parent
RESULTS_DIR = ROOT / "results"

NEUTRAL_VALUES: dict[str, int | float | None] = {
    "RevolvingUtilizationOfUnsecuredLines": 0.3,
    "age": 45,
    "NumberOfTime30-59DaysPastDueNotWorse": 0,
    "DebtRatio": 0.4,
    "MonthlyIncome": 5400.0,
    "NumberOfOpenCreditLinesAndLoans": 8,
    "NumberOfTimes90DaysLate": 0,
    "NumberRealEstateLoansOrLines": 1,
    "NumberOfTime60-89DaysPastDueNotWorse": 0,
    "NumberOfDependents": 1,
}


class ClientInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    revolving_utilization: float = Field(
        alias="RevolvingUtilizationOfUnsecuredLines", ge=0, le=1
    )
    age: int = Field(ge=18, le=120)
    past_due_30_59: int = Field(
        alias="NumberOfTime30-59DaysPastDueNotWorse", ge=0, le=20
    )
    debt_ratio: float = Field(alias="DebtRatio", ge=0, le=2)
    monthly_income: float | None = Field(alias="MonthlyIncome", ge=0)
    open_credit_lines: int = Field(
        alias="NumberOfOpenCreditLinesAndLoans", ge=0, le=60
    )
    past_due_90: int = Field(alias="NumberOfTimes90DaysLate", ge=0, le=20)
    real_estate_loans: int = Field(alias="NumberRealEstateLoansOrLines", ge=0, le=60)
    past_due_60_89: int = Field(
        alias="NumberOfTime60-89DaysPastDueNotWorse", ge=0, le=20
    )
    dependents: int = Field(alias="NumberOfDependents", ge=0, le=20)

    def as_client(self) -> dict[str, Any]:
        return self.model_dump(by_alias=True)


class SimulationRequest(BaseModel):
    client: ClientInput
    modified_fields: list[str] = Field(min_length=1, max_length=3)
    modified_values: dict[str, Any]


def _risk_level(probability: float, threshold: float) -> str:
    if probability < threshold * 0.5:
        return "Low"
    if probability <= threshold:
        return "Medium"
    if probability <= threshold * 1.3:
        return "High"
    return "Very high"


def _predict(scorer: CreditScorer, client: dict[str, Any]) -> dict[str, Any]:
    try:
        return scorer.predict(client)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _top_factors(
    scorer: CreditScorer, client: dict[str, Any], probability: float
) -> list[dict[str, Any]]:
    factors = []
    for feature, neutral_value in NEUTRAL_VALUES.items():
        changed_client = {**client, feature: neutral_value}
        changed_probability = _predict(scorer, changed_client)["probability"]
        effect = probability - changed_probability
        factors.append(
            {
                "feature": feature,
                "value": client[feature],
                "neutral_value": neutral_value,
                "effect": effect,
                "importance": abs(effect),
                "direction": "increases" if effect > 0 else "decreases",
            }
        )
    return sorted(factors, key=lambda item: item["importance"], reverse=True)[:3]


def _load_csv(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))
    for row in rows:
        if "" in row:
            row["feature"] = row.pop("")
        for key, value in tuple(row.items()):
            try:
                row[key] = float(value)
            except (TypeError, ValueError):
                pass
    return rows


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.scorer = CreditScorer(str(ROOT / "models"))
    yield


app = FastAPI(title="CreditScore AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")


@app.post("/api/predict")
def predict(request: ClientInput, raw_request: Request) -> dict[str, Any]:
    client = request.as_client()
    result = _predict(raw_request.app.state.scorer, client)
    return {
        **result,
        "risk_level": _risk_level(result["probability"], result["threshold"]),
        "top_factors": _top_factors(
            raw_request.app.state.scorer, client, result["probability"]
        ),
    }


@app.post("/api/simulate")
def simulate(request: SimulationRequest, raw_request: Request) -> dict[str, Any]:
    client = request.client.as_client()
    fields = request.modified_fields
    if len(set(fields)) != len(fields):
        raise HTTPException(status_code=422, detail="Modified fields must be unique.")
    if set(fields) != set(request.modified_values):
        raise HTTPException(
            status_code=422,
            detail="Provide exactly one modified value for each modified field.",
        )
    unknown = set(fields) - set(NEUTRAL_VALUES)
    if unknown:
        raise HTTPException(
            status_code=422, detail=f"Unknown modified fields: {', '.join(sorted(unknown))}."
        )

    try:
        updated_client = ClientInput(
            **{**client, **request.modified_values}
        ).as_client()
    except ValidationError as exc:
        raise HTTPException(
            status_code=422, detail="One or more modified values are invalid."
        ) from exc

    scorer = raw_request.app.state.scorer
    before = _predict(scorer, client)
    after = _predict(scorer, updated_client)
    return {
        "before_probability": before["probability"],
        "after_probability": after["probability"],
        "change": after["probability"] - before["probability"],
        "modified_fields": fields,
    }


@app.get("/api/metrics")
def metrics() -> dict[str, Any]:
    with (RESULTS_DIR / "final_metrics.json").open(encoding="utf-8") as file:
        return json.load(file)


@app.get("/api/comparison")
def comparison() -> list[dict[str, Any]]:
    return _load_csv(RESULTS_DIR / "models_comparison.csv")


@app.get("/api/feature-importance")
def feature_importance() -> list[dict[str, Any]]:
    return _load_csv(RESULTS_DIR / "feature_importance.csv")
