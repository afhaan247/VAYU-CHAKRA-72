import React, { useState, useEffect, useRef } from 'react';
import { CurrentStatus, MonitoringStation } from '../types';
import { useLiveSensor } from '../hooks/useLiveSensor';
import { Wind, Layers, Flame, Thermometer } from 'lucide-react';

interface Props {
  current: CurrentStatus | null;
  station: MonitoringStation;
  peak72hAqi: number;
}

function useFlash(value: number | string): boolean {
  const [flashing, setFlashing] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 400);
      return () => clearTimeout(t);
    }
  }, [value]);
  return flashing;
}

function AQIStamp({ aqi, catColor }: { aqi: number; catColor: string }) {
  const flashing = useFlash(aqi);

  return (
    <div
      className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl flex flex-col items-center justify-center border-2 flex-shrink-0 transition-all duration-300 ${
        flashing ? 'scale-105 shadow-lg' : 'scale-100'
      }`}
      style={{
        backgroundColor: `${catColor}12`,
        borderColor: catColor,
        boxShadow: flashing ? `0 0 16px ${catColor}55` : undefined,
      }}
    >
      <span
        className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono tabular-nums transition-all duration-200"
        style={{ color: catColor }}
      >
        {aqi}
      </span>
      <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-0.5">
        CPCB AQI
      </span>
      {/* Mini scanning sweep bar */}
      <div className="w-10 sm:w-14 h-0.5 mt-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animate-[scan_2s_ease-in-out_infinite]"
          style={{ background: catColor, width: '40%' }}
        />
      </div>
    </div>
  );
}

function LiveCell({
  label,
  value,
  unit,
  icon,
  flashColor = 'bg-blue-100 dark:bg-blue-900/60',
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  flashColor?: string;
}) {
  const flashing = useFlash(value);
  return (
    <div
      className={`rounded-lg p-2 sm:p-2.5 border transition-all duration-200 ${
        flashing
          ? `${flashColor} border-blue-300 dark:border-blue-600 scale-[1.02]`
          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
        <span className="text-[9px] sm:text-[10px] font-mono uppercase font-semibold truncate">{label}</span>
        {icon}
      </div>
      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums truncate">
        {value}
        {unit && <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function PollutantBadge({ label, value, unit }: { label: string; value: number; unit?: string }) {
  const flashing = useFlash(value);
  return (
    <div
      className={`p-1 sm:p-1.5 rounded border text-center transition-all duration-200 ${
        flashing
          ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-300 dark:border-amber-600 scale-105'
          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
      }`}
    >
      <span className="text-slate-400 block text-[8px] sm:text-[9px]">{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-[11px] sm:text-xs tabular-nums">{value}</span>
      {unit && <span className="text-[7px] sm:text-[8px] text-slate-400 ml-0.5 hidden sm:inline">{unit}</span>}
    </div>
  );
}

export const CurrentAQICard: React.FC<Props> = ({ current, station, peak72hAqi }) => {
  const live = useLiveSensor(current, station.multiplier);

  if (!current || !live) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
        <div className="p-4 sm:p-5 animate-pulse flex space-x-3 sm:space-x-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryInfo = (aqi: number) => {
    if (aqi <= 50)  return { category: 'Good',         color: '#00B050', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#92D050', bg: 'bg-lime-50 text-lime-800 border-lime-300' };
    if (aqi <= 200) return { category: 'Moderate',     color: '#E5A900', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
    if (aqi <= 300) return { category: 'Poor',         color: '#E36414', bg: 'bg-orange-50 text-orange-800 border-orange-300' };
    if (aqi <= 400) return { category: 'Very Poor',    color: '#D90429', bg: 'bg-red-50 text-red-800 border-red-300' };
    return           { category: 'Severe',             color: '#7A0026', bg: 'bg-rose-100 text-rose-950 border-rose-400' };
  };

  const catInfo = getCategoryInfo(live.aqi);

  const effectiveMaxAQI = Math.max(live.aqi, Math.round(peak72hAqi * station.multiplier));
  const getGrapStage = (aqi: number) => {
    if (aqi > 450) return { label: 'GRAP STAGE IV (EMERGENCY)', shortLabel: 'GRAP IV', cls: 'bg-rose-900 text-white' };
    if (aqi > 400) return { label: 'GRAP STAGE III (SEVERE)',   shortLabel: 'GRAP III', cls: 'bg-red-700 text-white' };
    if (aqi > 300) return { label: 'GRAP STAGE II (VERY POOR)', shortLabel: 'GRAP II', cls: 'bg-orange-600 text-white' };
    if (aqi > 200) return { label: 'GRAP STAGE I (POOR)',       shortLabel: 'GRAP I', cls: 'bg-amber-600 text-white' };
    return           { label: 'GRAP NORMAL MONITORING',         shortLabel: 'GRAP Normal', cls: 'bg-emerald-700 text-white' };
  };
  const grapBadge = getGrapStage(effectiveMaxAQI);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">

      {/* Top Banner Ribbon */}
      <div className="bg-slate-50 dark:bg-slate-800/60 px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
          <span className="flex h-2 w-2 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline">
            LIVE Continuous Feed:
          </span>
          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold truncate">
            {station.name}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-extrabold tracking-widest bg-red-600 text-white animate-pulse flex-shrink-0">
            ● LIVE
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 font-mono text-[10px] sm:text-[11px] flex-shrink-0">
          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] sm:text-xs ${grapBadge.cls}`}>
            <span className="sm:hidden">{grapBadge.shortLabel}</span>
            <span className="hidden sm:inline">{grapBadge.label}</span>
          </span>
          <span className="hidden md:inline text-slate-500 dark:text-slate-400 tabular-nums">
            Sample: {live.sampleTime}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-center">

        {/* AQI Gauge + sub-indices (col 1-5) */}
        <div className="lg:col-span-5 flex items-center space-x-3 sm:space-x-4">
          <AQIStamp aqi={live.aqi} catColor={catInfo.color} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
              <span className={`px-2 py-0.5 text-[11px] sm:text-xs font-bold font-mono tracking-wider rounded border uppercase ${catInfo.bg}`}>
                {catInfo.category}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                Dominant: <strong className="text-slate-800 dark:text-slate-200">{current.dominant_pollutant}</strong>
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1.5 sm:mt-2 leading-relaxed line-clamp-2">
              {current.health_statement}
            </p>

            {/* Pollutant sub-badges */}
            <div className="mt-2 grid grid-cols-4 gap-1 sm:gap-1.5 text-[10px] font-mono">
              <PollutantBadge label="PM2.5" value={Math.round(live.pm25)} unit="µg" />
              <PollutantBadge label="PM10"  value={Math.round(live.pm10)} unit="µg" />
              <PollutantBadge label="NOx"   value={Math.round(live.nox)}  unit="µg" />
              <PollutantBadge label="O₃"    value={Math.round(live.o3)}   unit="µg" />
            </div>
          </div>
        </div>

        {/* Atmospheric Boundary Condition Tiles (col 6-12) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">

          <LiveCell
            label="Wind Vector"
            value={`${live.wind_speed.toFixed(1)}`}
            unit="m/s"
            icon={<Wind className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />}
            flashColor="bg-blue-50 dark:bg-blue-900/40"
          />

          <LiveCell
            label="PBL Height"
            value={`${Math.round(live.pbl_height)}`}
            unit="m"
            icon={<Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            flashColor="bg-indigo-50 dark:bg-indigo-900/40"
          />

          <LiveCell
            label="Inversion Lid"
            value={live.inversion_index.toFixed(2)}
            icon={<Thermometer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            flashColor="bg-amber-50 dark:bg-amber-900/40"
          />

          <LiveCell
            label="Fire Factor"
            value={live.fire_influence.toFixed(1)}
            unit="/100"
            icon={<Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
            flashColor="bg-red-50 dark:bg-red-900/40"
          />

        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

    </div>
  );
};
