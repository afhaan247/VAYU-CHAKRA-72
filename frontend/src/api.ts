import { CurrentStatus, ForecastResponse, SimulationParams, SimulationResponse, HourExplanation, MLMetricsResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api';

export async function fetchCurrentStatus(): Promise<CurrentStatus> {
  const res = await fetch(`${API_BASE}/current`);
  if (!res.ok) throw new Error('Failed to fetch current AQI status');
  return res.json();
}

export async function fetch72HourForecast(): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/forecast`);
  if (!res.ok) throw new Error('Failed to fetch 72-hour forecast');
  return res.json();
}

export async function runPhysicsSimulation(params: SimulationParams): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run physics simulation');
  return res.json();
}

export async function fetchHourExplanation(hour: number): Promise<HourExplanation> {
  const res = await fetch(`${API_BASE}/explain/${hour}`);
  if (!res.ok) throw new Error(`Failed to fetch explanation for hour ${hour}`);
  return res.json();
}

export async function fetchMLMetrics(): Promise<MLMetricsResponse> {
  const res = await fetch(`${API_BASE}/ml/metrics`);
  if (!res.ok) throw new Error('Failed to fetch ML model diagnostics');
  return res.json();
}
