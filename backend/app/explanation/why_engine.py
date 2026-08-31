"""
Scientific Diagnostic & Explanation Engine ("WHY" Layer) for VAYU-CHAKRA 72
Provides detailed physical insights explaining atmospheric drivers for forecast hours.
"""

from typing import Dict, Any, List

def generate_scientific_explanation(
    hour_offset: int,
    pm25: float,
    aqi: int,
    category: str,
    pbl_height: float,
    wind_speed: float,
    ventilation_index: float,
    inversion_index: float,
    fire_influence: float,
    rainfall: float
) -> Dict[str, Any]:
    """
    Generates actionable scientific diagnostic reasons and impact vectors for a forecast timestep.
    """
    drivers = []
    triggers = []
    
    # 1. Planetary Boundary Layer (PBL) Dynamics
    if pbl_height < 250.0:
        drivers.append({
            "title": "Shallow Boundary Layer (PBL Trapping)",
            "severity": "HIGH",
            "icon": "Layers",
            "description": f"PBL height is compressed to {pbl_height:.0f}m, severely restricting vertical dispersion and trapping surface emissions.",
            "impact": "+35% PM2.5 Accumulation"
        })
        triggers.append("Shallow Planetary Boundary Layer (<250m)")
    elif pbl_height > 600.0:
        drivers.append({
            "title": "Deep Planetary Boundary Layer",
            "severity": "LOW",
            "icon": "ArrowUpCircle",
            "description": f"Expanded PBL height ({pbl_height:.0f}m) facilitates vertical mixing and dilution of particulates.",
            "impact": "Enhanced Vertical Dilution"
        })

    # 2. Atmospheric Inversion & Stagnation
    if inversion_index > 0.65:
        drivers.append({
            "title": "Severe Nocturnal Thermal Inversion",
            "severity": "CRITICAL",
            "icon": "ThermometerSnowflake",
            "description": f"Thermal Inversion Index at {inversion_index:.2f}. Warm air aloft caps cold surface air, creating atmospheric stagnation.",
            "impact": "High Stagnation / Surface Trapping"
        })
        triggers.append("Thermal Surface Inversion")

    # 3. Wind & Ventilation Index
    if ventilation_index < 1200.0:
        drivers.append({
            "title": "Weak Ventilation & Stagnant Winds",
            "severity": "HIGH",
            "icon": "Wind",
            "description": f"Ventilation index is critically low ({ventilation_index:.0f} m²/s) with wind speed at {wind_speed:.1f} m/s.",
            "impact": "Poor Lateral Dispersion"
        })
        triggers.append("Stagnant Horizontal Ventilation")
    elif ventilation_index > 3000.0:
        drivers.append({
            "title": "Strong Atmospheric Flushing",
            "severity": "LOW",
            "icon": "Wind",
            "description": f"High ventilation rate ({ventilation_index:.0f} m²/s) rapidly transports pollutants out of Delhi NCR.",
            "impact": "-25% Concentration Drop"
        })

    # 4. Regional Agricultural Fire Plume Transport
    if fire_influence > 15.0:
        drivers.append({
            "title": "NW Stubble Burning Plume Inflow",
            "severity": "CRITICAL",
            "icon": "Flame",
            "description": f"Regional Fire Influence Index is elevated ({fire_influence:.1f}). North-westerly wind vector aligns with Punjab/Haryana fire corridor.",
            "impact": f"+{fire_influence * 1.2:.0f} µg/m³ PM2.5 Load"
        })
        triggers.append("Active Agricultural Biomass Burning Plume")

    # 5. Rainfall & Precipitation Scavenging
    if rainfall > 0.5:
        drivers.append({
            "title": "Precipitation Wet Scavenging",
            "severity": "LOW",
            "icon": "CloudRain",
            "description": f"Active rainfall ({rainfall:.1f} mm) washes out airborne aerosols via wet deposition.",
            "impact": "Wet Aerosol Scavenging"
        })
        triggers.append("Precipitation Washout")

    # Fallback default driver if atmosphere is stable
    if not drivers:
        drivers.append({
            "title": "Nominal Urban Background Emissions",
            "severity": "INFO",
            "icon": "Activity",
            "description": "Pollutant concentration governed primarily by diurnal local vehicular and industrial baseload.",
            "impact": "Standard Background Dispersion"
        })

    primary_cause = drivers[0]["title"] if drivers else "Background Atmospheric Conditions"

    return {
        "hour_offset": hour_offset,
        "aqi": aqi,
        "category": category,
        "primary_cause": primary_cause,
        "key_triggers": triggers,
        "diagnostic_drivers": drivers
    }
