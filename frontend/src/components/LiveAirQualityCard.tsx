import React from 'react';
import { Wind, Layers, Thermometer, Flame } from 'lucide-react';
import { CurrentStatus, MonitoringStation } from '../types';

interface LiveAirQualityCardProps {
  current: CurrentStatus | null;
  selectedStation: MonitoringStation;
  className?: string;
}

export const LiveAirQualityCard: React.FC<LiveAirQualityCardProps> = ({
  current,
  selectedStation,
  className = '',
}) => {
  // Fallback default values if API loading
  const aqi = current?.aqi ?? 311;
  const category = current?.category ?? 'VERY POOR';
  const dominant = current?.dominant_pollutant ?? 'PM2.5';
  const healthStatement = current?.health_statement ?? 'Respiratory illness on prolonged exposure.';
  const sampleTime = current?.timestamp ? `${current.timestamp} IST` : 'Sample: 21:04:41 IST';

  const pm25 = current?.pm25 ? Math.round(current.pm25) : 132;
  const pm10 = current?.pm10 ? Math.round(current.pm10) : 202;
  const nox = current?.nox ? Math.round(current.nox) : 90;
  const o3 = current?.o3 ? Math.round(current.o3) : 15;

  const windSpeed = current?.wind_speed ? current.wind_speed.toFixed(1) : '2.1';
  const windDir = 'WSW';
  const pblHeight = current?.pbl_height ? Math.round(current.pbl_height) : 187;
  const inversion = current?.inversion_index ? current.inversion_index.toFixed(2) : '0.56';
  const fireFactor = current?.fire_influence ? current.fire_influence.toFixed(1) : '0.4';

  return (
    <div
      className={`bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] shadow-xs flex flex-col justify-between overflow-hidden p-5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
        <h3 className="text-xs font-bold text-[#1C201C] uppercase tracking-wide">
          LIVE AIR QUALITY ({selectedStation.name})
        </h3>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#2E7D47]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Hero AQI + Category Block */}
      <div className="py-4 grid grid-cols-2 gap-4 items-center border-b border-[#EFEBE3]">
        
        {/* Left: Big AQI Number & Burgundy Badge */}
        <div>
          <span className="text-[11px] font-mono uppercase text-[#666D67] font-semibold block mb-0.5">
            AQI (CPCB)
          </span>
          <div className="text-5xl sm:text-6xl font-black text-[#1C201C] tracking-tight font-sans">
            {aqi}
          </div>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 rounded-md bg-[#7A1B22] text-white text-xs font-black tracking-wider uppercase shadow-xs">
              {category}
            </span>
          </div>
        </div>

        {/* Right: Dominant Pollutant & Statement */}
        <div className="flex flex-col justify-center space-y-1 text-xs">
          <div>
            <span className="text-[#666D67] font-normal">Dominant: </span>
            <span className="font-bold text-[#1C201C]">{dominant}</span>
          </div>
          <p className="text-[11px] text-[#666D67] font-normal leading-relaxed">
            {healthStatement}
          </p>
          <span className="text-[10px] text-[#8C958E] font-mono mt-1 block">
            {sampleTime}
          </span>
        </div>

      </div>

      {/* 4-Column Pollutant Concentrations Grid */}
      <div className="grid grid-cols-4 gap-2 py-4 border-b border-[#EFEBE3] text-center">
        
        <div className="px-1">
          <span className="text-[10px] font-mono text-[#666D67] font-medium block mb-0.5">PM2.5</span>
          <span className="text-lg font-bold text-[#1C201C] block">{pm25}</span>
          <span className="text-[9px] text-[#8C958E] font-mono">µg/m³</span>
        </div>

        <div className="px-1 border-l border-[#EFEBE3]">
          <span className="text-[10px] font-mono text-[#666D67] font-medium block mb-0.5">PM10</span>
          <span className="text-lg font-bold text-[#1C201C] block">{pm10}</span>
          <span className="text-[9px] text-[#8C958E] font-mono">µg/m³</span>
        </div>

        <div className="px-1 border-l border-[#EFEBE3]">
          <span className="text-[10px] font-mono text-[#666D67] font-medium block mb-0.5">NOx</span>
          <span className="text-lg font-bold text-[#1C201C] block">{nox}</span>
          <span className="text-[9px] text-[#8C958E] font-mono">µg/m³</span>
        </div>

        <div className="px-1 border-l border-[#EFEBE3]">
          <span className="text-[10px] font-mono text-[#666D67] font-medium block mb-0.5">O₃</span>
          <span className="text-lg font-bold text-[#1C201C] block">{o3}</span>
          <span className="text-[9px] text-[#8C958E] font-mono">µg/m³</span>
        </div>

      </div>

      {/* 4-Metric Meteorological Row */}
      <div className="pt-3.5 grid grid-cols-4 gap-2 text-left">
        
        <div>
          <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-[#666D67] mb-1">
            <Wind className="w-3 h-3 text-[#556057]" />
            <span>WIND</span>
          </div>
          <p className="text-xs font-bold text-[#1C201C]">{windSpeed} m/s</p>
          <span className="text-[10px] text-[#8C958E] font-mono">{windDir}</span>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-[#666D67] mb-1">
            <Layers className="w-3 h-3 text-[#556057]" />
            <span className="truncate">PBL HGT</span>
          </div>
          <p className="text-xs font-bold text-[#1C201C]">{pblHeight} m</p>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-[#666D67] mb-1">
            <Thermometer className="w-3 h-3 text-[#556057]" />
            <span className="truncate">INVERSION</span>
          </div>
          <p className="text-xs font-bold text-[#1C201C]">{inversion}</p>
        </div>

        <div>
          <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-[#666D67] mb-1">
            <Flame className="w-3 h-3 text-[#556057]" />
            <span className="truncate">FIRE</span>
          </div>
          <p className="text-xs font-bold text-[#1C201C]">{fireFactor} <span className="text-[9px] font-normal text-[#8C958E]">/100</span></p>
        </div>

      </div>

    </div>
  );
};
