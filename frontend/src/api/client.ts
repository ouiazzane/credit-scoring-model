import type { Client, ComparisonRow, ImportanceRow, Metrics, Prediction } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let body: { detail?: unknown } | null = null;
    try {
      body = await response.json() as { detail?: unknown };
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    const detail = body?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg).join(" ")
        : "The request could not be completed. Please try again.";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  predict: (client: Client) => request<Prediction>("/api/predict", {
    method: "POST",
    body: JSON.stringify(client),
  }),
  simulate: (client: Client, changes: Partial<Client>) => {
    const modified_fields = Object.keys(changes) as (keyof Client)[];
    return request<{
      before_probability: number;
      after_probability: number;
      change: number;
      modified_fields: string[];
    }>("/api/simulate", {
      method: "POST",
      body: JSON.stringify({ client, modified_fields, modified_values: changes }),
    });
  },
  metrics: () => request<Metrics>("/api/metrics"),
  comparison: () => request<ComparisonRow[]>("/api/comparison"),
  featureImportance: () => request<ImportanceRow[]>("/api/feature-importance"),
};
