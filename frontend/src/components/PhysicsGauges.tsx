import React from 'react';
import { ForecastHourItem } from '../types';
import { Layers, Wind, Flame, Compass } from 'lucide-react';

interface Props {
  forecastHour: ForecastHourItem | null;
}

export const PhysicsGauges: React.FC<Props> = ({ forecastHour }) => {
  if (!forecastHour) return null;

  const vIndex = forecastHour.ventilation_index;
  const invIndex = forecastHour.inversion_index;
  const fireInf = forecastHour.fire_influence;
  const pbl = forecastHour.pbl_height;

  // Ventilation Status
  const getVentilationStatus = (v: number) => {
    if (v < 1200) return { label: 'CRITICAL STAGNATION', color: 'text-red-700 dark:text-red-400', barColor: 'bg-red-600', width: Math.min(100, (v / 4000) * 100) };
    if (v < 2200) return { label: 'RESTRICTED DISPERSION', color: 'text-amber-700 dark:text-amber-400', barColor: 'bg-amber-500', width: Math.min(100, (v / 4000) * 100) };
    return { label: 'HIGH FLUSHING', color: 'text-emerald-700 dark:text-emerald-400', barColor: 'bg-emerald-500', width: Math.min(100, (v / 4000) * 100) };
  };

  // Inversion Status
  const getInversionStatus = (inv: number) => {
    if (inv > 0.65) return { label: 'SEVERE SURFACE INVERSION', color: 'text-red-700 dark:text-red-400', barColor: 'bg-red-600', width: inv * 100 };
    if (inv > 0.40) return { label: 'MODERATE INVERSION', color: 'text-amber-700 dark:text-amber-400', barColor: 'bg-amber-500', width: inv * 100 };
    return { label: 'NORMAL LAPSE RATE', color: 'text-emerald-700 dark:text-emerald-400', barColor: 'bg-emerald-500', width: inv * 100 };
  };

  const ventStat = getVentilationStatus(vIndex);
  const invStat = getInversionStatus(invIndex);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov p-4">
      
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-700 dark:text-sky-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Reduced-Order Boundary Layer Physics State (+{forecastHour.hour}h)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          Governing Equations: Box Dispersion & Bulk Richardson
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        
        {/* Gauge 1: Ventilation Index */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
              <Wind className="w-3.5 h-3.5 text-blue-600" />
              Ventilation Rate (Vc)
            </span>
            <span className={`text-xs font-bold ${ventStat.color}`}>
              {Math.round(vIndex)} m²/s
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full ${ventStat.barColor} transition-all duration-500`} style={{ width: `${ventStat.width}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{ventStat.label}</span>
            <span className="text-slate-500 dark:text-slate-400">PBL: {Math.round(pbl)}m</span>
          </div>
        </div>

        {/* Gauge 2: Thermal Inversion */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Thermal Inversion (I_inv)
            </span>
            <span className={`text-xs font-bold ${invStat.color}`}>
              {invIndex.toFixed(2)}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full ${invStat.barColor} transition-all duration-500`} style={{ width: `${invStat.width}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{invStat.label}</span>
            <span className="text-slate-500 dark:text-slate-400">Cap: Nocturnal</span>
          </div>
        </div>

        {/* Gauge 3: Fire Plume Influence */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              Biomass Plume Vector
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {fireInf.toFixed(1)} / 100
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${Math.min(100, fireInf * 2)}%` }}></div>
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Punjab/Haryana Corridor</span>
            <span className="text-slate-500 dark:text-slate-400">NW Alignment</span>
          </div>
        </div>

      </div>
    </div>
  );
};
