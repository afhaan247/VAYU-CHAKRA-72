"""
Official CPCB (Central Pollution Control Board) Air Quality Index (AQI) Calculator
Converts pollutant concentrations (PM2.5, PM10, O3, NOx, SO2, CO) to Indian AQI sub-indices and overall AQI.
"""

from typing import Dict, Any, Tuple

PM25_BREAKPOINTS = [
    (0, 30, 0, 50),
    (31, 60, 51, 100),
    (61, 90, 101, 200),
    (91, 120, 201, 300),
    (121, 250, 301, 400),
    (251, 380, 401, 500),
]

PM10_BREAKPOINTS = [
    (0, 50, 0, 50),
    (51, 100, 51, 100),
    (101, 250, 101, 200),
    (251, 350, 201, 300),
    (351, 430, 301, 400),
    (431, 510, 401, 500),
]

O3_BREAKPOINTS = [
    (0, 50, 0, 50),
    (51, 100, 51, 100),
    (101, 168, 101, 200),
    (169, 208, 201, 300),
    (209, 748, 301, 400),
    (749, 1000, 401, 500),
]

NO2_BREAKPOINTS = [
    (0, 40, 0, 50),
    (41, 80, 51, 100),
    (81, 180, 101, 200),
    (181, 280, 201, 300),
    (281, 400, 301, 400),
    (401, 500, 401, 500),
]


def calculate_sub_index(conc: float, breakpoints: list) -> float:
    if conc < 0:
        return 0.0
    
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= conc <= c_high:
            return i_low + (i_high - i_low) * (conc - c_low) / (c_high - c_low)
            
    # Handle concentrations exceeding maximum breakpoint linearly
    c_low, c_high, i_low, i_high = breakpoints[-1]
    if conc > c_high:
        extra_ratio = (conc - c_high) / (c_high - c_low)
        return min(600.0, i_high + (i_high - i_low) * extra_ratio)
        
    return 0.0


def get_aqi_category(aqi: float) -> Tuple[str, str, str]:
    val = round(aqi)
    if val <= 50:
        return "GOOD", "#10B981", "Minimal health impact."
    elif val <= 100:
        return "SATISFACTORY", "#84CC16", "Minor breathing discomfort to sensitive people."
    elif val <= 200:
        return "MODERATE", "#F59E0B", "Breathing discomfort to people with lungs, asthma, and heart diseases."
    elif val <= 300:
        return "POOR", "#F97316", "Breathing discomfort to most people on prolonged exposure."
    elif val <= 400:
        return "VERY POOR", "#EF4444", "Respiratory illness on prolonged exposure."
    else:
        return "SEVERE", "#991B1B", "Affects healthy people and seriously impacts those with existing diseases."


def calculate_cpcb_aqi(pm25: float, pm10: float, o3: float, nox: float) -> Dict[str, Any]:
    sub_pm25 = calculate_sub_index(pm25, PM25_BREAKPOINTS)
    sub_pm10 = calculate_sub_index(pm10, PM10_BREAKPOINTS)
    sub_o3 = calculate_sub_index(o3, O3_BREAKPOINTS)
    sub_nox = calculate_sub_index(nox, NO2_BREAKPOINTS)
    
    sub_indices = {
        "PM2.5": round(sub_pm25, 1),
        "PM10": round(sub_pm10, 1),
        "O3": round(sub_o3, 1),
        "NOx": round(sub_nox, 1)
    }
    
    # Dominant pollutant has max sub-index
    dominant_pollutant = max(sub_indices, key=sub_indices.get)
    overall_aqi = round(sub_indices[dominant_pollutant])
    
    category, color, health_statement = get_aqi_category(overall_aqi)
    
    return {
        "aqi": overall_aqi,
        "category": category,
        "color": color,
        "health_statement": health_statement,
        "dominant_pollutant": dominant_pollutant,
        "sub_indices": sub_indices
    }
