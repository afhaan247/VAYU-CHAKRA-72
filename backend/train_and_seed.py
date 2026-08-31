"""
Dataset Generator & Training Pipeline for VAYU-CHAKRA 72
Generates a realistic Delhi NCR winter atmospheric dataset (90 days hourly data),
trains the PyTorch AtmosphericSeq2SeqLSTM model, evaluates MAE/RMSE across 24h, 48h, 72h horizons,
and saves the trained model checkpoint model.pt alongside realistic test episode data.
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

# Set seeds
torch.manual_seed(42)
np.random.seed(42)
random.seed(42)

def generate_delhi_winter_dataset(num_days: int = 90) -> dict:
    """
    Generates 90 days of hourly realistic Delhi NCR winter meteorology & air quality data.
    Simulates diurnal PBL cycles, agricultural stubble fires, wind shifts, and inversion events.
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
    cur_pm25 = 180.0
    cur_pm10 = 310.0
    cur_o3 = 42.0
    cur_nox = 85.0
    
    for h in range(num_hours):
        day_of_season = h // 24
        hour_of_day = h % 24
        
        # Diurnal solar cycle
        solar = max(0.0, math.sin((hour_of_day - 6) / 12 * math.pi) * 650.0) if 6 <= hour_of_day <= 18 else 0.0
        solar_list.append(round(solar, 1))
        
        # Temperature (min around 5 AM, max around 2 PM)
        temp = 14.0 + 8.0 * math.sin((hour_of_day - 8) / 24 * 2 * math.pi) + random.uniform(-1.0, 1.0)
        temp_list.append(round(temp, 1))
        
        # Relative Humidity (inversely correlated with temp)
        humidity = 85.0 - 25.0 * math.sin((hour_of_day - 8) / 24 * 2 * math.pi) + random.uniform(-3.0, 3.0)
        humidity_list.append(round(min(98.0, max(30.0, humidity)), 1))
        
        # Planetary Boundary Layer (PBL) Height (Shallow at night ~180m, deep during day ~750m)
        pbl = 200.0 + 550.0 * max(0.0, math.sin((hour_of_day - 7) / 12 * math.pi)) ** 1.5 + random.uniform(-20, 20)
        pbl_list.append(round(max(120.0, pbl), 1))
        
        # Wind speed & direction (NW dominant in winter ~315°)
        ws = max(0.8, 2.2 + 1.2 * math.sin((hour_of_day - 10) / 24 * 2 * math.pi) + random.uniform(-0.5, 0.5))
        ws_list.append(round(ws, 1))
        
        wd = (315.0 + random.uniform(-25.0, 25.0)) % 360.0
        wd_list.append(round(wd, 1))
        
        # Pressure (hPa)
        pressure = 1016.0 + 3.0 * math.sin(h / 12.0) + random.uniform(-0.5, 0.5)
        pressure_list.append(round(pressure, 1))
        
        # Rainfall (rare in winter, occasional Western Disturbance)
        rain = 4.5 if (day_of_season in [22, 58] and 10 <= hour_of_day <= 16) else 0.0
        rain_list.append(round(rain, 1))
        
        # Stubble Fire Activity (Peaks during November, days 15 to 40)
        if 15 <= day_of_season <= 40:
            fire_count = int(random.uniform(400, 1500) * (1.0 + 0.3 * math.sin(day_of_season)))
        else:
            fire_count = int(random.uniform(20, 150))
        fire_list.append(fire_count)
        
        # Physical pollution dynamics
        # Night accumulation (low PBL, weak winds)
        trapping = (300.0 / max(120.0, pbl)) * (2.5 / ws)
        
        # Fire contribution factor
        fire_flux = (fire_count / 150.0) * (ws / 2.5) if (290 <= wd <= 340) else 0.0
        
        # Update concentrations with momentum + physics drive
        cur_pm25 = 0.82 * cur_pm25 + 18.0 * trapping + 4.0 * fire_flux + random.uniform(-8, 8)
        if rain > 0:
            cur_pm25 *= 0.55 # Washout
            
        cur_pm25 = max(25.0, min(480.0, cur_pm25))
        cur_pm10 = cur_pm25 * random.uniform(1.5, 1.85)
        
        # Ozone peaks during high solar radiation
        cur_o3 = 15.0 + 0.08 * solar + random.uniform(-3, 3)
        cur_nox = 35.0 + 22.0 * trapping + (30.0 if (7 <= hour_of_day <= 10 or 17 <= hour_of_day <= 20) else 0.0) + random.uniform(-5, 5)
        
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
    n = len(data["pm25"])
    num_hours = n
    
    # Feature matrix [N, 15]
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

    features = np.array(features, dtype=np.float32) # [N, 15]
    
    # Normalization stats
    mean = np.mean(features, axis=0)
    std = np.std(features, axis=0) + 1e-5
    norm_features = (features - mean) / std

    X, Y = [], []
    for i in range(lookback, num_hours - horizon):
        X.append(norm_features[i - lookback : i]) # [72, 15]
        # Targets are unnormalized raw pollutant concentrations for direct loss & metrics
        target_seq = features[i : i + horizon, :4] # [72, 4]
        Y.append(target_seq)

    X = torch.tensor(np.array(X), dtype=torch.float32)
    Y = torch.tensor(np.array(Y), dtype=torch.float32)
    
    return X, Y, mean, std, features


def train_model():
    print("Generating high-fidelity 90-day Delhi winter episode dataset...")
    dataset = generate_delhi_winter_dataset(num_days=90)
    
    X, Y, mean, std, raw_features = prepare_tensors(dataset)
    print(f"Dataset generated: X shape = {X.shape}, Y shape = {Y.shape}", flush=True)
    
    # Train / Val split (Chronological 85% train, 15% val/test)
    split_idx = int(len(X) * 0.85)
    X_train, Y_train = X[:split_idx], Y[:split_idx]
    X_val, Y_val = X[split_idx:], Y[split_idx:]
    
    train_loader = DataLoader(TensorDataset(X_train, Y_train), batch_size=32, shuffle=True)
    
    from app.ml.forecaster import AtmosphericSeq2SeqLSTM
    model = AtmosphericSeq2SeqLSTM(input_dim=15, hidden_dim=64, output_dim=4)
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.MSELoss()
    
    print("\nTraining AtmosphericSeq2SeqLSTM Model for 15 Epochs...", flush=True)
    model.train()
    for epoch in range(1, 16):
        total_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_x) # [batch, 72, 4]
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * batch_x.size(0)
            
        train_rmse = math.sqrt(total_loss / len(X_train))
        if epoch % 5 == 0 or epoch == 1:
            print(f"Epoch {epoch:02d}/15 - Loss (MSE): {total_loss / len(X_train):.2f} | RMSE: {train_rmse:.2f} µg/m³", flush=True)

    # Evaluation across 24h, 48h, 72h horizons
    model.eval()
    with torch.no_grad():
        val_preds = model(X_val) # [N_val, 72, 4]
        
    print("\n" + "="*60)
    print("VAYU-CHAKRA 72 SCIENTIFIC EVALUATION METRICS (Test Set)")
    print("="*60)
    
    horizons = [24, 48, 72]
    pollutant_names = ["PM2.5", "PM10", "O3", "NOx"]
    
    for h in horizons:
        print(f"\n--- Horizon: +{h} Hours ---")
        h_preds = val_preds[:, h-1, :] # [N_val, 4]
        h_targets = Y_val[:, h-1, :]   # [N_val, 4]
        
        for p_idx, p_name in enumerate(pollutant_names):
            p_pred = h_preds[:, p_idx].numpy()
            p_true = h_targets[:, p_idx].numpy()
            
            mae = np.mean(np.abs(p_pred - p_true))
            rmse = np.sqrt(np.mean((p_pred - p_true) ** 2))
            ss_res = np.sum((p_true - p_pred) ** 2)
            ss_tot = np.sum((p_true - np.mean(p_true)) ** 2)
            r2 = 1.0 - (ss_res / (ss_tot + 1e-5))
            
            print(f"  {p_name:6s} | MAE: {mae:5.2f} µg/m³ | RMSE: {rmse:5.2f} µg/m³ | R²: {r2:.3f}")

    # Save model checkpoint
    os.makedirs("data", exist_ok=True)
    model_save_path = "model.pt"
    torch.save(model.state_dict(), model_save_path)
    print(f"\nSaved trained PyTorch model checkpoint to '{model_save_path}'.")

    # Save norm stats & latest 72h test episode for API consumption
    meta_info = {
        "mean": mean.tolist(),
        "std": std.tolist(),
        "test_episode": {
            k: dataset[k][-144:] for k in dataset # 72h past + 72h ground truth future
        }
    }
    with open("data/meta_and_episode.json", "w") as f:
        json.dump(meta_info, f, indent=2)
    print("Saved test episode dataset to 'data/meta_and_episode.json'.")


if __name__ == "__main__":
    train_model()
