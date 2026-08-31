import React, { useState } from 'react';
import { SimulationParams, SimulationResponse } from '../types';
import { runPhysicsSimulation } from '../api';
import { POLICY_PRESETS } from '../data/stations';
import { 
  Sliders, 
  RotateCcw, 
  Flame, 
  Wind, 
  Layers, 
  CloudRain, 
  TrendingDown,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface Props {
  onSimulationResult: (simResult: SimulationResponse) => void;
  onReset: () => void;
}

export const SimulatorControl: React.FC<Props> = ({ onSimulationResult, onReset }) => {
  const initialParams: SimulationParams = {
    wind_speed: 2.5,
    wind_direction: 315.0,
    pbl_height: 250.0,
    fire_count: 850,
    humidity: 65.0,
    rainfall: 0.0,
  };

  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runPhysicsSimulation(params);
      setSimResult(res);
      onSimulationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof POLICY_PRESETS[0]) => {
    setActivePreset(preset.id);
    setParams(preset.params);
  };

  const handleReset = () => {
    setParams(initialParams);
    setActivePreset(null);
    setSimResult(null);
    onReset();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
      
      {/* Header */}
      <div className="px-3.5 sm:px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              "What-If" Interventional Physics Policy Simulator
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Evaluate municipal interventions & atmospheric boundary shifts on 72h AQI
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition border border-slate-300 dark:border-slate-700 self-start sm:self-auto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Baseline</span>
        </button>
      </div>

      <div className="p-3.5 sm:p-4 space-y-3.5 sm:space-y-4">
        
        {/* Government Scenario Presets */}
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block mb-2">
            Preset Policy & Meteorological Scenarios:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {POLICY_PRESETS.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2.5 sm:p-2 rounded-lg border text-left transition text-xs flex flex-col justify-between active:scale-[0.99] ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-500' 
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <span className={`inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border mb-1 ${p.badgeColor}`}>
                      {p.badgeText}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                      {p.title}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight font-normal">
                    {p.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Tuning Parameter Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
          
          {/* Slider 1: Wind Speed */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                <Wind className="w-3.5 h-3.5 text-blue-600" />
                Wind Velocity
              </span>
              <span className="font-bold text-blue-700 dark:text-cyan-400">{params.wind_speed} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={params.wind_speed}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, wind_speed: parseFloat(e.target.value) });
              }}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg touch-pan-x"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>Stagnant (0.5)</span>
              <span>Flushing (8.0)</span>
            </div>
          </div>

          {/* Slider 2: Stubble Fires */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                Active Stubble Fires
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">{params.fire_count}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={params.fire_count}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, fire_count: parseInt(e.target.value) });
              }}
              className="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg touch-pan-x"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>Zero (0)</span>
              <span>Severe (2000)</span>
            </div>
          </div>

          {/* Slider 3: PBL Height */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                PBL Mixing Height
              </span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">{params.pbl_height} m</span>
            </div>
            <input
              type="range"
              min="120"
              max="1000"
              step="20"
              value={params.pbl_height}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, pbl_height: parseFloat(e.target.value) });
              }}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg touch-pan-x"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>Trapping (120m)</span>
              <span>Expanded (1000m)</span>
            </div>
          </div>

          {/* Slider 4: Rainfall */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700/70">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                <CloudRain className="w-3.5 h-3.5 text-emerald-600" />
                Rainfall Rate
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{params.rainfall} mm/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={params.rainfall}
              onChange={(e) => {
                setActivePreset(null);
                setParams({ ...params, rainfall: parseFloat(e.target.value) });
              }}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg touch-pan-x"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>Dry (0.0)</span>
              <span>Rain (10.0)</span>
            </div>
          </div>

        </div>

        {/* Action Button & Simulation Delta Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-lg bg-[#0F2A4A] hover:bg-[#163b65] active:bg-[#0c213a] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50 min-h-[44px]"
          >
            <Cpu className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : 'text-cyan-300'}`} />
            <span>{loading ? 'Computing Reduced-Order Physics...' : 'Run Physics Simulation'}</span>
          </button>

          {simResult && (
            <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200">
              <div className="flex items-center space-x-1.5">
                {simResult.aqi_delta <= 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>72h Shift: </span>
                <strong className={simResult.aqi_delta <= 0 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-red-700 dark:text-red-400 font-bold'}>
                  {simResult.aqi_delta > 0 ? `+${simResult.aqi_delta}` : simResult.aqi_delta} AQI
                </strong>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                ({simResult.baseline_72h_avg_aqi} → {simResult.simulated_72h_avg_aqi})
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
