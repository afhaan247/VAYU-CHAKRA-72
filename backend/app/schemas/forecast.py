"""
Pydantic API Schemas for VAYU-CHAKRA 72 Backend
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CurrentStatusResponse(BaseModel):
    timestamp: str
    location: str
    aqi: int
    category: str
    color: str
    dominant_pollutant: str
    health_statement: str
    pm25: float
    pm10: float
    o3: float
    nox: float
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: float
    pbl_height: float
    inversion_index: float
    fire_influence: float

class ForecastHourItem(BaseModel):
    hour: int
    timestamp: str
    aqi: int
    category: str
    color: str
    dominant_pollutant: str
    pm25: float
    pm25_p10: float
    pm25_p90: float
    pm10: float
    o3: float
    nox: float
    pbl_height: float
    ventilation_index: float
    inversion_index: float
    fire_influence: float
    primary_cause: str

class ForecastResponse(BaseModel):
    forecast_horizon_hours: int
    generated_at: str
    location: str
    overall_72h_max_aqi: int
    overall_72h_avg_aqi: int
    dominant_period_cause: str
    forecast: List[ForecastHourItem]

class SimulationRequest(BaseModel):
    wind_speed: float = 2.5
    wind_direction: float = 315.0
    pbl_height: float = 250.0
    fire_count: int = 800
    humidity: float = 65.0
    rainfall: float = 0.0

class SimulationResponse(BaseModel):
    status: str
    modified_parameters: Dict[str, Any]
    baseline_72h_avg_aqi: int
    simulated_72h_avg_aqi: int
    aqi_delta: int
    impact_summary: str
    forecast: List[ForecastHourItem]

class MLHorizonMetric(BaseModel):
    mae: float
    rmse: float
    r2: float
    mape: float

class MLMetricsResponse(BaseModel):
    model_level: str
    status: str
    architecture: str
    parameters_count: int
    input_features_count: int
    forecast_horizon_hours: int
    trained_epochs: int
    physics_compliance_rate: float
    target_baseline_means: Dict[str, float]
    evaluation_metrics: Dict[str, Dict[str, MLHorizonMetric]]
    training_loss_history: List[float]
