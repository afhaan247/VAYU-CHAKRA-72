"""
Dataset Generator & Level 8 Training Pipeline for VAYU-CHAKRA 72
Generates a multi-season realistic Delhi NCR atmospheric dataset (180 days / 4320 hours),
trains the Physics-Informed Multi-Head Temporal Attention Bi-LSTM forecaster with Target Normalization
and Physics-Regularized Composite Loss, evaluates MAE/RMSE/R² across 24h, 48h, 72h horizons,
and saves the trained model checkpoint model.pt alongside metadata and realistic test episode data.
"""

import os
import json
import math
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np

# Set deterministic seeds
torch.manual_seed(42)
np.random.seed(42)
random.seed(42)


def generate_delhi_winter_dataset(num_days: int = 180) -> dict:
    """
    Generates 180 days of hourly realistic Delhi NCR meteorology & air quality dynamics.
    Simulates diurnal boundary layer oscillations, agricultural stubble fires, wind shifts,
    nocturnal thermal inversions, traffic rush hours, and Western Disturbance precipitation.
    """
    num_hours = num_days * 24
    timestamps = []
    
    pm25_list = []
    pm10_list = []
    o3_list = []
    nox_list = []
    
    temp_list = []
    humidity_list = []
    ws_list = []
    wd_list = []
    pressure_list = []
    pbl_list = []
    rain_list = []
    fire_list = []
    solar_list = []
    
    # Baseline values
    cur_pm25 = 175.0
    cur_pm10 = 300.0
    cur_o3 = 38.0
    cur_nox = 80.0
    
    for h in range(num_hours):
        day_of_season = h // 24
        hour_of_day = h % 24
        
        # Diurnal solar cycle
        solar = max(0.0, math.sin((hour_of_day - 6) / 12 * math.pi) * 680.0) if 6 <= hour_of_day <= 18 else 0.0
        solar_list.append(round(solar, 1))
        
        # Temperature (min at 06:00, max at 14:00)
        temp = 14.0 + 8.5 * math.sin((hour_of_day - 8) / 24 * 2 * math.pi) + random.uniform(-0.8, 0.8)
        temp_list.append(round(temp, 1))
        
        # Relative Humidity (inversely correlated with temp)
        humidity = 82.0 - 28.0 * math.sin((hour_of_day - 8) / 24 * 2 * math.pi) + random.uniform(-2.5, 2.5)
        humidity = min(98.0, max(28.0, humidity))
        humidity_list.append(round(humidity, 1))
        
        # Planetary Boundary Layer (PBL) Height (Shallow at night ~160-220m, deep midday ~750-900m)
        pbl_base = 180.0 + 620.0 * (max(0.0, math.sin((hour_of_day - 7) / 12 * math.pi)) ** 1.4)
        pbl = max(110.0, pbl_base + random.uniform(-15, 15))
        pbl_list.append(round(pbl, 1))
        
        # Wind speed & direction (NW dominant in winter ~315°)
        ws = max(0.8, 2.4 + 1.3 * math.sin((hour_of_day - 11) / 24 * 2 * math.pi) + random.uniform(-0.4, 0.4))
        ws_list.append(round(ws, 1))
        
        wd = (315.0 + random.uniform(-22.0, 22.0) + 15.0 * math.sin(day_of_season / 10.0)) % 360.0
        wd_list.append(round(wd, 1))
        
        # Pressure (hPa)
        pressure = 1016.5 + 2.8 * math.sin(h / 12.0) + random.uniform(-0.4, 0.4)
        pressure_list.append(round(pressure, 1))
        
        # Rainfall (Occasional Western Disturbance events)
        rain = 5.2 if (day_of_season in [24, 76, 138] and 9 <= hour_of_day <= 15) else 0.0
        rain_list.append(round(rain, 1))
        
        # Stubble Fire Activity (Peaks during November, days 25 to 70)
        if 25 <= day_of_season <= 70:
            fire_count = int(random.uniform(500, 1600) * (1.0 + 0.35 * math.sin(day_of_season / 5.0)))
        elif 71 <= day_of_season <= 110:
            fire_count = int(random.uniform(100, 450))
        else:
            fire_count = int(random.uniform(20, 120))
        fire_list.append(fire_count)
        
        # Physical dynamic drivers
        # Nocturnal inversion trapping
        trapping = (320.0 / max(110.0, pbl)) * (2.6 / ws)
        
        # NW Plume alignment factor
        rad_diff = math.radians(wd - 315.0)
        nw_alignment = max(0.0, math.cos(rad_diff))
        fire_flux = (fire_count / 140.0) * (ws / 2.5) * nw_alignment
        
        # Traffic rush hour emissions (08:00-10:00 & 18:00-21:00)
        rush_hour = 35.0 if (8 <= hour_of_day <= 10 or 18 <= hour_of_day <= 21) else 10.0
        
        # Update PM2.5 with physical mass balance + temporal inertia
        target_pm25 = 95.0 + 26.0 * trapping + 6.2 * fire_flux + 0.8 * rush_hour
        cur_pm25 = 0.78 * cur_pm25 + 0.22 * target_pm25 + random.uniform(-4, 4)
        
        # Washout scavenging
        if rain > 0:
            cur_pm25 *= 0.52
            
        cur_pm25 = max(20.0, min(495.0, cur_pm25))
        
        # PM10 dynamics (Coarse dust + PM2.5 ratio >= 1.25)
        dust_activity = 1.35 + 0.25 * (ws / 3.0)
        cur_pm10 = cur_pm25 * dust_activity + random.uniform(10, 25)
        cur_pm10 = max(cur_pm25 * 1.18, min(750.0, cur_pm10))
        
        # Ozone photochemical dynamics (solar radiation dependent)
        cur_o3 = 14.0 + 0.085 * solar + random.uniform(-2.5, 2.5)
        
        # NOx (traffic and combustion dependent)
        cur_nox = 32.0 + 20.0 * trapping + rush_hour * 1.1 + random.uniform(-4, 4)
        
        pm25_list.append(round(cur_pm25, 1))
        pm10_list.append(round(cur_pm10, 1))
        o3_list.append(round(cur_o3, 1))
        nox_list.append(round(cur_nox, 1))
        timestamps.append(f"Day {day_of_season+1} {hour_of_day:02d}:00")

    return {
        "timestamps": timestamps,
        "pm25": pm25_list,
        "pm10": pm10_list,
        "o3": o3_list,
        "nox": nox_list,
        "temperature": temp_list,
        "humidity": humidity_list,
        "wind_speed": ws_list,
        "wind_direction": wd_list,
        "pressure": pressure_list,
        "pbl_height": pbl_list,
        "rainfall": rain_list,
        "fire_activity": fire_list,
        "solar_radiation": solar_list
    }


def prepare_tensors(data: dict, lookback: int = 72, horizon: int = 72):
    """
    Constructs normalized sliding window input tensors and normalized target tensors.
    """
    num_hours = len(data["pm25"])
    
    features = []
    targets = []
    
    for i in range(num_hours):
        hour_val = i % 24
        h_sin = math.sin(2 * math.pi * hour_val / 24.0)
        h_cos = math.cos(2 * math.pi * hour_val / 24.0)
        
        feat = [
            data["pm25"][i], data["pm10"][i], data["o3"][i], data["nox"][i],
            data["temperature"][i], data["humidity"][i], data["wind_speed"][i], data["wind_direction"][i],
            data["pressure"][i], data["pbl_height"][i], data["rainfall"][i], data["fire_activity"][i],
            data["solar_radiation"][i], h_sin, h_cos
        ]
        features.append(feat)
        targets.append([data["pm25"][i], data["pm10"][i], data["o3"][i], data["nox"][i]])

    features = np.array(features, dtype=np.float32) # [N, 15]
    targets = np.array(targets, dtype=np.float32)   # [N, 4]
    
    # Input Feature Normalization stats
    feat_mean = np.mean(features, axis=0)
    feat_std = np.std(features, axis=0) + 1e-5
    norm_features = (features - feat_mean) / feat_std

    # Target Normalization stats (for stable multi-task gradients across disparate pollutant scales)
    target_mean = np.mean(targets, axis=0)
    target_std = np.std(targets, axis=0) + 1e-5
    norm_targets = (targets - target_mean) / target_std

    X, Y_norm, Y_raw = [], [], []
    for i in range(lookback, num_hours - horizon):
        X.append(norm_features[i - lookback : i]) # [72, 15]
        Y_norm.append(norm_targets[i : i + horizon]) # [72, 4] normalized
        Y_raw.append(targets[i : i + horizon])      # [72, 4] unnormalized raw targets

    X = torch.tensor(np.array(X), dtype=torch.float32)
    Y_norm = torch.tensor(np.array(Y_norm), dtype=torch.float32)
    Y_raw = torch.tensor(np.array(Y_raw), dtype=torch.float32)
    
    return X, Y_norm, Y_raw, feat_mean, feat_std, target_mean, target_std, features


class PhysicsInformedCompositeLoss(nn.Module):
    """
    Composite Physics Loss:
    1. Smooth L1 (Huber) Loss for robust multi-step regression
    2. Multi-horizon MSE for extreme episodic penalization
    3. Physics Constraint Penalty: enforces PM10 >= PM2.5
    4. Temporal Smoothness Regularization: penalizes unrealistic high-frequency variance
    """
    def __init__(self, target_mean: np.ndarray, target_std: np.ndarray, lambda_phys: float = 0.25, lambda_smooth: float = 0.05):
        super(PhysicsInformedCompositeLoss, self).__init__()
        self.huber = nn.SmoothL1Loss()
        self.mse = nn.MSELoss()
        self.t_mean = torch.tensor(target_mean, dtype=torch.float32)
        self.t_std = torch.tensor(target_std, dtype=torch.float32)
        self.lambda_phys = lambda_phys
        self.lambda_smooth = lambda_smooth

    def forward(self, pred_norm: torch.Tensor, target_norm: torch.Tensor) -> torch.Tensor:
        # Base regression losses on normalized predictions
        loss_huber = self.huber(pred_norm, target_norm)
        loss_mse = self.mse(pred_norm, target_norm)
        
        # Denormalize to check physical constraints
        device = pred_norm.device
        t_mean = self.t_mean.to(device)
        t_std = self.t_std.to(device)
        
        pred_raw = pred_norm * t_std + t_mean
        pred_pm25 = pred_raw[:, :, 0]
        pred_pm10 = pred_raw[:, :, 1]
        
        # Physics Constraint Penalty: PM2.5 > PM10 violation
        phys_violation = torch.relu(pred_pm25 - pred_pm10)
        loss_phys = torch.mean(phys_violation)
        
        # Temporal smoothness loss: difference between consecutive time steps
        diff_pred = pred_norm[:, 1:, :] - pred_norm[:, :-1, :]
        diff_target = target_norm[:, 1:, :] - target_norm[:, :-1, :]
        loss_smooth = torch.mean((diff_pred - diff_target) ** 2)
        
        total_loss = loss_huber + 0.4 * loss_mse + self.lambda_phys * loss_phys + self.lambda_smooth * loss_smooth
        return total_loss


def train_model():
    print("="*70)
    print("VAYU-CHAKRA 72 | LEVEL 8 ATMOSPHERIC FORECASTER TRAINING PIPELINE")
    print("="*70)
    
    print("\n[1/5] Generating high-resolution 180-day Delhi winter atmospheric dataset...")
    dataset = generate_delhi_winter_dataset(num_days=180)
    
    X, Y_norm, Y_raw, feat_mean, feat_std, target_mean, target_std, raw_features = prepare_tensors(dataset)
    print(f"  Dataset Shape: X = {X.shape}, Y = {Y_norm.shape}", flush=True)
    print(f"  Input Features: 15 variables | Forecast Horizon: 72 hours (4 pollutants)")
    print(f"  Target Baseline Means: PM2.5={target_mean[0]:.1f}, PM10={target_mean[1]:.1f}, O3={target_mean[2]:.1f}, NOx={target_mean[3]:.1f}")
    
    # Chronological Train / Val split (85% train, 15% validation/test)
    split_idx = int(len(X) * 0.85)
    X_train, Y_train_norm = X[:split_idx], Y_norm[:split_idx]
    X_val, Y_val_norm, Y_val_raw = X[split_idx:], Y_norm[split_idx:], Y_raw[split_idx:]
    
    train_dataset = TensorDataset(X_train, Y_train_norm)
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    
    from app.ml.forecaster import PhysicsTemporalAttentionForecaster
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n[2/5] Initializing PhysicsTemporalAttentionForecaster on device: {device}")
    
    model = PhysicsTemporalAttentionForecaster(
        input_dim=15,
        hidden_dim=64,
        num_layers=2,
        num_heads=4,
        output_dim=4,
        forecast_horizon=72,
        dropout_p=0.15
    ).to(device)
    
    param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Total Trainable Parameters: {param_count:,}")
    
    optimizer = optim.AdamW(model.parameters(), lr=1.5e-3, weight_decay=1e-4)
    epochs = 35
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=2e-5)
    criterion = PhysicsInformedCompositeLoss(target_mean, target_std)
    
    print(f"\n[3/5] Training Level 8 Forecaster for {epochs} Epochs with Physics Composite Loss...")
    model.train()
    history = []
    
    for epoch in range(1, epochs + 1):
        total_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)
            
            optimizer.zero_grad()
            preds = model(batch_x) # [batch, 72, 4]
            loss = criterion(preds, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.5)
            optimizer.step()
            
            total_loss += loss.item() * batch_x.size(0)
            
        scheduler.step()
        avg_loss = total_loss / len(X_train)
        history.append(round(avg_loss, 4))
        
        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}/{epochs} | Composite Loss: {avg_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}", flush=True)

    print("\n[4/5] Evaluating Multi-Horizon Scientific Test Metrics...")
    model.eval()
    with torch.no_grad():
        val_preds_norm = model(X_val.to(device)).cpu().numpy() # [N_val, 72, 4]
        
    # Denormalize predictions to physical concentration units
    val_preds_raw = val_preds_norm * target_std + target_mean
    val_targets_raw = Y_val_raw.numpy()
    
    horizons = [24, 48, 72]
    pollutant_names = ["PM2.5", "PM10", "O3", "NOx"]
    
    eval_metrics = {}
    print("\n" + "="*70)
    print("VAYU-CHAKRA 72 | LEVEL 8 SCIENTIFIC BENCHMARK METRICS")
    print("="*70)
    
    for h in horizons:
        print(f"\n--- Forecast Horizon: +{h} Hours ---")
        h_preds = val_preds_raw[:, h-1, :]
        h_targets = val_targets_raw[:, h-1, :]
        eval_metrics[f"h{h}"] = {}
        
        for p_idx, p_name in enumerate(pollutant_names):
            p_pred = h_preds[:, p_idx]
            p_true = h_targets[:, p_idx]
            
            mae = float(np.mean(np.abs(p_pred - p_true)))
            rmse = float(np.sqrt(np.mean((p_pred - p_true) ** 2)))
            ss_res = float(np.sum((p_true - p_pred) ** 2))
            ss_tot = float(np.sum((p_true - np.mean(p_true)) ** 2))
            r2 = float(1.0 - (ss_res / (ss_tot + 1e-5)))
            mape = float(np.mean(np.abs((p_true - p_pred) / (p_true + 1e-3))) * 100.0)
            
            eval_metrics[f"h{h}"][p_name] = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 3),
                "mape": round(mape, 2)
            }
            
            print(f"  {p_name:6s} | MAE: {mae:5.2f} µg/m³ | RMSE: {rmse:5.2f} µg/m³ | R²: {r2:5.3f} | MAPE: {mape:4.1f}%")

    # Check physics consistency
    pm25_preds = val_preds_raw[:, :, 0]
    pm10_preds = val_preds_raw[:, :, 1]
    violations = np.sum(pm25_preds > pm10_preds)
    total_points = pm25_preds.size
    physics_compliance = float(100.0 * (1.0 - (violations / total_points)))
    print(f"\nPhysics Consistency Rate (PM10 >= PM2.5): {physics_compliance:.2f}% ({violations}/{total_points} violations)")

    print("\n[5/5] Saving Trained Model Checkpoint & Meta Episode...")
    os.makedirs("data", exist_ok=True)
    model_save_path = "model.pt"
    torch.save(model.state_dict(), model_save_path)
    print(f"  Saved trained Level 8 PyTorch model to '{model_save_path}'.")

    # Save comprehensive metadata, scaling stats, and latest 144h episode (72h past + 72h ground truth)
    meta_info = {
        "model_level": "Level 8: Physics-Informed Temporal Attention Bi-LSTM",
        "parameters_count": param_count,
        "input_features_count": 15,
        "forecast_horizon_hours": 72,
        "trained_epochs": epochs,
        "physics_compliance_rate": physics_compliance,
        "mean": feat_mean.tolist(),
        "std": feat_std.tolist(),
        "target_mean": target_mean.tolist(),
        "target_std": target_std.tolist(),
        "training_loss_history": history,
        "evaluation_metrics": eval_metrics,
        "test_episode": {
            k: dataset[k][-144:] for k in dataset
        }
    }
    with open("data/meta_and_episode.json", "w") as f:
        json.dump(meta_info, f, indent=2)
    print("  Saved metadata and test episode to 'data/meta_and_episode.json'.")
    print("="*70)
    print("Level 8 ML Upgrade Training Complete!")
    print("="*70)


if __name__ == "__main__":
    train_model()
