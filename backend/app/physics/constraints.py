"""
Reduced-Order Atmospheric Physics Module for VAYU-CHAKRA 72
Implements atmospheric dispersion, PBL ventilation dynamics, thermal inversion indices,
stubble-burning plume transport physics, and physical boundary constraints.
"""

import math
from typing import Dict, Any, List

def calculate_ventilation_index(pbl_height: float, wind_speed: float) -> float:
    """Ventilation Index V_c = PBL_Height (m) * Wind_Speed (m/s)"""
    return max(10.0, float(pbl_height * wind_speed))


def calculate_inversion_index(pbl_height: float, wind_speed: float, humidity: float, temp: float) -> float:
    """
    Thermal Inversion / Stagnation Index (0.0 to 1.0)
    High values (>0.7) represent severe nocturnal surface inversions trapping pollutants.
    """
    pbl_factor = max(0.0, (350.0 - pbl_height) / 350.0)
    wind_factor = max(0.0, (4.5 - wind_speed) / 4.5)
    humidity_factor = max(0.0, (humidity - 40.0) / 60.0)
    
    inversion = (0.5 * pbl_factor) + (0.35 * wind_factor) + (0.15 * humidity_factor)
    return min(1.0, max(0.0, float(inversion)))


def calculate_fire_plume_influence(fire_count: int, wind_speed: float, wind_direction: float, distance_km: float = 250.0) -> float:
    """
    Regional Stubble Burning Plume Influence Factor (0.0 to 100.0)
    Evaluates NW wind alignment (315° towards Delhi NCR) with quadratic distance decay.
    """
    if fire_count <= 0:
        return 0.0
        
    # NW wind vector alignment (315 degrees is classic Punjab -> Delhi plume trajectory)
    rad = math.radians(wind_direction - 315.0)
    alignment = max(0.0, math.cos(rad))
    
    # Distance decay factor
    decay = math.exp(-distance_km / 300.0)
    
    # Transport speed factor (wind speed between 2.0 m/s and 8.0 m/s accelerates plume arrival)
    speed_factor = min(1.5, max(0.2, wind_speed / 4.0))
    
    influence = (fire_count / 30.0) * alignment * decay * speed_factor
    return min(100.0, max(0.0, float(influence)))


def apply_physics_constraints(
    raw_predictions: Dict[str, List[float]], 
    meteo_horizon: List[Dict[str, float]]
) -> Dict[str, Any]:
    """
    Applies physical laws & reduced-order constraints to ML trajectory predictions:
    1. PM10 >= PM2.5 physical inequality
    2. Wet deposition / rainfall scavenging reduction
    3. Ventilation dispersion adjustments
    4. Stubble fire plume flux addition
    """
    n_steps = len(raw_predictions["pm25"])
    
    corrected_pm25 = []
    corrected_pm10 = []
    corrected_o3 = []
    corrected_nox = []
    
    pbl_list = []
    ventilation_list = []
    inversion_list = []
    fire_influence_list = []
    physics_adjustments = []

    for t in range(n_steps):
        met = meteo_horizon[t] if t < len(meteo_horizon) else meteo_horizon[-1]
        
        pbl = met.get("pbl_height", 250.0)
        ws = met.get("wind_speed", 2.5)
        wd = met.get("wind_direction", 315.0)
        humidity = met.get("humidity", 65.0)
        temp = met.get("temperature", 18.0)
        rain = met.get("rainfall", 0.0)
        fire_count = int(met.get("fire_activity", 0))

        v_index = calculate_ventilation_index(pbl, ws)
        inv_index = calculate_inversion_index(pbl, ws, humidity, temp)
        fire_inf = calculate_fire_plume_influence(fire_count, ws, wd)

        pbl_list.append(round(pbl, 1))
        ventilation_list.append(round(v_index, 1))
        inversion_list.append(round(inv_index, 2))
        fire_influence_list.append(round(fire_inf, 1))

        # Base ML forecasts
        pm25 = raw_predictions["pm25"][t]
        pm10 = raw_predictions["pm10"][t]
        o3 = raw_predictions["o3"][t]
        nox = raw_predictions["nox"][t]

        # 1. Rain Washout Scavenging (Wet Deposition)
        if rain > 0.1:
            scavenging = math.exp(-0.2 * rain)
            pm25 *= scavenging
            pm10 *= scavenging
            nox *= scavenging

        # 2. Ventilation / High Wind Dispersion
        if v_index > 3000.0:
            dispersion_factor = max(0.65, 1.0 - 0.00008 * (v_index - 3000.0))
            pm25 *= dispersion_factor
            pm10 *= dispersion_factor
            nox *= dispersion_factor

        # 3. Nocturnal Inversion Trapping (PBL Compression)
        if inv_index > 0.65:
            trapping_boost = 1.0 + 0.25 * (inv_index - 0.65)
            pm25 *= trapping_boost
            pm10 *= trapping_boost

        # 4. Fire Plume Particulate Flux Contribution
        if fire_inf > 5.0:
            fire_flux = 1.2 * fire_inf
            pm25 += fire_flux
            pm10 += fire_flux * 1.4

        # 5. Physical Ratio Boundary (PM10 must be strictly >= PM2.5)
        pm10 = max(pm10, pm25 * 1.15)
        
        # Ensure non-negative
        pm25 = max(5.0, pm25)
        pm10 = max(10.0, pm10)
        o3 = max(2.0, o3)
        nox = max(5.0, nox)

        corrected_pm25.append(round(pm25, 1))
        corrected_pm10.append(round(pm10, 1))
        corrected_o3.append(round(o3, 1))
        corrected_nox.append(round(nox, 1))

    return {
        "pm25": corrected_pm25,
        "pm10": corrected_pm10,
        "o3": corrected_o3,
        "nox": corrected_nox,
        "pbl_height": pbl_list,
        "ventilation_index": ventilation_list,
        "inversion_index": inversion_list,
        "fire_influence": fire_influence_list,
    }
