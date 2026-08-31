export interface CurrentStatus {
  timestamp: string;
  location: string;
  station_id?: string;
  aqi: number;
  category: string;
  color: string;
  dominant_pollutant: string;
  health_statement: string;
  pm25: number;
  pm10: number;
  o3: number;
  nox: number;
  so2?: number;
  co?: number;
  nh3?: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pbl_height: number;
  inversion_index: number;
  fire_influence: number;
}

export interface ForecastHourItem {
  hour: number;
  timestamp: string;
  aqi: number;
  category: string;
  color: string;
  dominant_pollutant: string;
  pm25: number;
  pm25_p10: number;
  pm25_p90: number;
  pm10: number;
  o3: number;
  nox: number;
  pbl_height: number;
  ventilation_index: number;
  inversion_index: number;
  fire_influence: number;
  primary_cause: string;
}

export interface ForecastResponse {
  forecast_horizon_hours: number;
  generated_at: string;
  location: string;
  overall_72h_max_aqi: number;
  overall_72h_avg_aqi: number;
  dominant_period_cause: string;
  forecast: ForecastHourItem[];
}

export interface SimulationParams {
  wind_speed: number;
  wind_direction: number;
  pbl_height: number;
  fire_count: number;
  humidity: number;
  rainfall: number;
}

export interface SimulationResponse {
  status: string;
  modified_parameters: Record<string, any>;
  baseline_72h_avg_aqi: number;
  simulated_72h_avg_aqi: number;
  aqi_delta: number;
  impact_summary: string;
  forecast: ForecastHourItem[];
}

export interface ExplanationDriver {
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  icon: string;
  description: string;
  impact: string;
}

export interface HourExplanation {
  hour_offset: number;
  aqi: number;
  category: string;
  primary_cause: string;
  key_triggers: string[];
  diagnostic_drivers: ExplanationDriver[];
}

export interface MonitoringStation {
  id: string;
  name: string;
  code: string;
  state: string;
  agency: string;
  type: string;
  latitude: number;
  longitude: number;
  status: "ONLINE" | "MAINTENANCE" | "DEGRADED";
  multiplier: number; // Multiplier to simulate realistic localized variation
}

export interface GrapStageInfo {
  stage: number;
  roman: string;
  title: string;
  aqiRange: string;
  color: string;
  badgeClass: string;
  actions: string[];
}

export interface NaaqsPollutantItem {
  name: string;
  formula: string;
  unit: string;
  standard24h: number;
  currentValue: number;
  avg72hValue: number;
  category: string;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  badgeText: string;
  badgeColor: string;
  params: SimulationParams;
}
