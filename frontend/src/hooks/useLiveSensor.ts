import { useState, useEffect, useRef } from 'react';
import { CurrentStatus } from '../types';

// ─── Sensor simulation config ───────────────────────────────────────────────
// Each field gets its own tick config:
//   • noise   – max ±random noise per tick (realistic sensor jitter)
//   • drift   – slow long-term drift magnitude (environmental trend)
//   • min/max – hard physical bounds
//   • rate    – ms between updates for this channel

interface ChannelCfg {
  noise: number;
  drift: number;
  min: number;
  max: number;
  rate: number;  // ms between ticks
}

const CHANNELS: Record<string, ChannelCfg> = {
  aqi:             { noise: 3,    drift: 0.8,  min: 30,   max: 500,  rate: 3000  },
  pm25:            { noise: 2,    drift: 0.6,  min: 5,    max: 400,  rate: 3500  },
  pm10:            { noise: 3,    drift: 0.7,  min: 10,   max: 600,  rate: 4000  },
  nox:             { noise: 4,    drift: 1.0,  min: 5,    max: 300,  rate: 2500  },
  o3:              { noise: 1.5,  drift: 0.4,  min: 5,    max: 200,  rate: 5000  },
  wind_speed:      { noise: 0.2,  drift: 0.05, min: 0.1,  max: 12,   rate: 6000  },
  wind_direction:  { noise: 4,    drift: 1.5,  min: 0,    max: 360,  rate: 8000  },
  pbl_height:      { noise: 8,    drift: 3,    min: 80,   max: 1200, rate: 10000 },
  inversion_index: { noise: 0.01, drift: 0.004,min: 0,    max: 1,    rate: 7000  },
  fire_influence:  { noise: 0.4,  drift: 0.1,  min: 0,    max: 100,  rate: 9000  },
};

// Gaussian-distributed random (Box-Muller) — more realistic than uniform
function gaussRandom(sigma: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Wrap wind direction to [0, 360)
function wrapDir(d: number): number {
  return ((d % 360) + 360) % 360;
}

export interface LiveSensorReading {
  aqi: number;
  pm25: number;
  pm10: number;
  nox: number;
  o3: number;
  wind_speed: number;
  wind_direction: number;
  pbl_height: number;
  inversion_index: number;
  fire_influence: number;
  // Which channel just changed this tick (for flash animation)
  lastChanged: string | null;
  sampleTime: string;
}

export function useLiveSensor(baseline: CurrentStatus | null, stationMultiplier: number): LiveSensorReading | null {
  const stateRef = useRef<LiveSensorReading | null>(null);
  const driftRef = useRef<Record<string, number>>({});
  const [reading, setReading] = useState<LiveSensorReading | null>(null);

  // Seed state from baseline whenever it changes
  useEffect(() => {
    if (!baseline) return;
    const m = stationMultiplier;
    stateRef.current = {
      aqi:             Math.round(baseline.aqi * m),
      pm25:            Math.round(baseline.pm25 * m * 10) / 10,
      pm10:            Math.round(baseline.pm10 * m * 10) / 10,
      nox:             Math.round(baseline.nox * m * 10) / 10,
      o3:              Math.round(baseline.o3 * m * 10) / 10,
      wind_speed:      Math.round(baseline.wind_speed * 10) / 10,
      wind_direction:  Math.round(baseline.wind_direction),
      pbl_height:      Math.round(baseline.pbl_height),
      inversion_index: Math.round(baseline.inversion_index * 1000) / 1000,
      fire_influence:  Math.round(baseline.fire_influence * 10) / 10,
      lastChanged:     null,
      sampleTime:      new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };
    // Initialize slow drift direction per channel
    Object.keys(CHANNELS).forEach((k) => {
      driftRef.current[k] = gaussRandom(0.5);
    });
    setReading({ ...stateRef.current });
  }, [baseline, stationMultiplier]);

  // Independent interval per channel — each pollutant updates at its own pace
  useEffect(() => {
    if (!baseline || !stateRef.current) return;

    const timers: number[] = [];

    Object.entries(CHANNELS).forEach(([key, cfg]) => {
      const timer = window.setInterval(() => {
        if (!stateRef.current) return;

        const prev = (stateRef.current as any)[key] as number;

        // Slowly reverse drift direction when near bounds to create realistic oscillation
        const mid = (cfg.min + cfg.max) / 2;
        const pull = (mid - prev) / (cfg.max - cfg.min); // gentle mean-reversion
        driftRef.current[key] += gaussRandom(0.3) + pull * 0.2;
        // Dampen drift so it doesn't run away
        driftRef.current[key] *= 0.92;

        const delta = gaussRandom(cfg.noise) + driftRef.current[key] * cfg.drift;

        let next: number;
        if (key === 'wind_direction') {
          next = wrapDir(prev + delta);
        } else if (key === 'inversion_index') {
          next = clamp(Math.round((prev + delta) * 1000) / 1000, cfg.min, cfg.max);
        } else if (key === 'aqi') {
          next = clamp(Math.round(prev + delta), cfg.min, cfg.max);
        } else if (['pm25', 'pm10', 'nox', 'o3', 'fire_influence', 'wind_speed'].includes(key)) {
          next = clamp(Math.round((prev + delta) * 10) / 10, cfg.min, cfg.max);
        } else {
          next = clamp(Math.round(prev + delta), cfg.min, cfg.max);
        }

        stateRef.current = {
          ...stateRef.current,
          [key]: next,
          lastChanged: key,
          sampleTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        };
        setReading({ ...stateRef.current });
      }, cfg.rate);

      timers.push(timer);
    });

    return () => timers.forEach(window.clearInterval);
  }, [baseline, stationMultiplier]);

  return reading;
}
