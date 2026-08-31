"""
PyTorch Multi-Output Seq2Seq LSTM Forecasting Model for VAYU-CHAKRA 72
Predicts 72-hour future trajectories of PM2.5, PM10, O3, and NOx from 72-hour past state.
Includes Monte Carlo Dropout for ensemble uncertainty bounds (10th, 50th, 90th percentiles).
"""

import os
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any

FEATURE_NAMES = [
    "pm25", "pm10", "o3", "nox",
    "temperature", "humidity", "wind_speed", "wind_direction", "pressure",
    "pbl_height", "rainfall", "fire_activity", "solar_radiation",
    "hour_sin", "hour_cos"
]

TARGET_NAMES = ["pm25", "pm10", "o3", "nox"]


class AtmosphericSeq2SeqLSTM(nn.Module):
    def __init__(self, input_dim: int = 15, hidden_dim: int = 64, output_dim: int = 4, forecast_horizon: int = 72):
        super(AtmosphericSeq2SeqLSTM, self).__init__()
        self.forecast_horizon = forecast_horizon
        self.output_dim = output_dim
        
        # Encoder
        self.encoder = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            batch_first=True
        )
        
        self.dropout = nn.Dropout(p=0.15)
        
        # Direct Sequence Generator Head
        self.fc_sequence = nn.Sequential(
            nn.Linear(hidden_dim, 128),
            nn.ReLU(),
            nn.Dropout(p=0.15),
            nn.Linear(128, forecast_horizon * output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: [batch, 72, 15]
        batch_size = x.size(0)
        _, (hidden, _) = self.encoder(x) # hidden: [1, batch, hidden_dim]
        hidden_last = hidden.squeeze(0) # [batch, hidden_dim]
        
        out_flat = self.fc_sequence(hidden_last) # [batch, 72 * 4]
        out_seq = out_flat.view(batch_size, self.forecast_horizon, self.output_dim) # [batch, 72, 4]
        return out_seq


class ForecasterService:
    def __init__(self, model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AtmosphericSeq2SeqLSTM().to(self.device)
        self.is_trained = False
        
        if model_path and os.path.exists(model_path):
            try:
                self.model.load_state_dict(torch.load(model_path, map_location=self.device))
                self.model.eval()
                self.is_trained = True
            except Exception as e:
                print(f"Warning: Could not load model checkpoint from {model_path}: {e}")

    def enable_mc_dropout(self):
        """Enables dropout during inference for Monte Carlo uncertainty estimation"""
        for module in self.model.modules():
            if isinstance(module, nn.Dropout):
                module.train()

    def predict_with_uncertainty(self, input_tensor: torch.Tensor, n_mc_samples: int = 15) -> Dict[str, Any]:
        """
        Runs Monte Carlo Dropout forward passes to obtain mean predictions and 10th/90th percentile bounds.
        """
        self.model.eval()
        self.enable_mc_dropout()
        
        samples = []
        with torch.no_grad():
            for _ in range(n_mc_samples):
                out = self.model(input_tensor.to(self.device)) # [1, 72, 4]
                samples.append(out.cpu().numpy()[0]) # [72, 4]
                
        samples = np.array(samples) # [N, 72, 4]
        
        mean_preds = np.mean(samples, axis=0) # [72, 4]
        p10_preds = np.percentile(samples, 10, axis=0) # [72, 4]
        p90_preds = np.percentile(samples, 90, axis=0) # [72, 4]
        
        return {
            "mean": {
                "pm25": mean_preds[:, 0].tolist(),
                "pm10": mean_preds[:, 1].tolist(),
                "o3": mean_preds[:, 2].tolist(),
                "nox": mean_preds[:, 3].tolist(),
            },
            "p10": {
                "pm25": p10_preds[:, 0].tolist(),
                "pm10": p10_preds[:, 1].tolist(),
                "o3": p10_preds[:, 2].tolist(),
                "nox": p10_preds[:, 3].tolist(),
            },
            "p90": {
                "pm25": p90_preds[:, 0].tolist(),
                "pm10": p90_preds[:, 1].tolist(),
                "o3": p90_preds[:, 2].tolist(),
                "nox": p90_preds[:, 3].tolist(),
            }
        }
