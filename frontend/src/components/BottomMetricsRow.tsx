import React from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  Wind, 
  Sliders, 
  Activity, 
  ArrowRight 
} from 'lucide-react';
import { AppPage } from './Sidebar';

interface BottomMetricsRowProps {
  onNavigate: (page: AppPage) => void;
  peakAqi?: number;
  grapStage?: number;
  ventilationRate?: number;
}

export const BottomMetricsRow: React.FC<BottomMetricsRowProps> = ({
  onNavigate,
  peakAqi = 354,
  grapStage = 2,
  ventilationRate = 394,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-4">
      
      {/* 1. 72H Peak Forecast Card */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] p-4 flex flex-col justify-between shadow-xs hover:border-[#D0C9BD] transition group">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#666D67] font-semibold mb-2">
            <span>72H PEAK FORECAST</span>
            <TrendingUp className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-2xl font-black text-[#B91C1C] font-sans tracking-tight">
              {peakAqi}
            </span>
            <span className="text-xs font-bold text-[#B91C1C]">
              AQI (Severe)
            </span>
          </div>
          <p className="text-[11px] text-[#666D67] leading-relaxed mt-1">
            Peak episode projected around Hour +1.
          </p>
        </div>

        <button
          onClick={() => onNavigate('forecast')}
          className="flex items-center space-x-1 text-xs font-bold text-[#1C201C] group-hover:text-[#2E7D47] mt-3 pt-2 border-t border-[#EFEBE3] transition text-left"
        >
          <span>View 72h Timeline</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 2. CAQM GRAP Status Card */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] p-4 flex flex-col justify-between shadow-xs hover:border-[#D0C9BD] transition group">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#666D67] font-semibold mb-2">
            <span>CAQM GRAP STATUS</span>
            <ShieldAlert className="w-4 h-4 text-[#2E7D47]" />
          </div>
          <div className="flex items-center space-x-2 my-1">
            <span className="text-xl font-black text-[#1C201C] font-sans tracking-tight">
              STAGE {grapStage}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EAE5DC] text-[#424E45] border border-[#D5CEC2]">
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-[#666D67] leading-relaxed mt-1 line-clamp-2">
            BS-III/IV LMV restrictions and mechanized sweeping...
          </p>
        </div>

        <button
          onClick={() => onNavigate('compliance')}
          className="flex items-center space-x-1 text-xs font-bold text-[#1C201C] group-hover:text-[#2E7D47] mt-3 pt-2 border-t border-[#EFEBE3] transition text-left"
        >
          <span>View GRAP Directives</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 3. Ventilation Rate (Vc) Card */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] p-4 flex flex-col justify-between shadow-xs hover:border-[#D0C9BD] transition group">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#666D67] font-semibold mb-2">
            <span>VENTILATION RATE (Vc)</span>
            <Wind className="w-4 h-4 text-[#666D67]" />
          </div>
          <div className="flex items-baseline space-x-1 my-1">
            <span className="text-2xl font-black text-[#1C201C] font-sans tracking-tight">
              {ventilationRate}
            </span>
            <span className="text-xs font-bold text-[#666D67]">
              m²/s
            </span>
          </div>
          <p className="text-[11px] text-[#666D67] leading-relaxed mt-1">
            Severe atmospheric stagnation cap.
          </p>
        </div>

        <button
          onClick={() => onNavigate('physics')}
          className="flex items-center space-x-1 text-xs font-bold text-[#1C201C] group-hover:text-[#2E7D47] mt-3 pt-2 border-t border-[#EFEBE3] transition text-left"
        >
          <span>Inspect "WHY" Engine</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 4. Policy Simulator Card */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] p-4 flex flex-col justify-between shadow-xs hover:border-[#D0C9BD] transition group">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#666D67] font-semibold mb-2">
            <span>POLICY SIMULATOR</span>
            <Sliders className="w-4 h-4 text-[#666D67]" />
          </div>
          <div className="flex items-baseline space-x-1.5 my-1">
            <span className="text-2xl font-black text-[#1C201C] font-sans tracking-tight">
              5
            </span>
            <span className="text-xs font-bold text-[#1C201C]">
              SCENARIOS
            </span>
          </div>
          <p className="text-[11px] text-[#666D67] leading-relaxed mt-1 line-clamp-2">
            Test stubble burning wave, rain washout, and vehicle...
          </p>
        </div>

        <button
          onClick={() => onNavigate('simulator')}
          className="flex items-center space-x-1 text-xs font-bold text-[#1C201C] group-hover:text-[#2E7D47] mt-3 pt-2 border-t border-[#EFEBE3] transition text-left"
        >
          <span>Launch Sandbox</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* 5. System Health Card */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E4DFD5] p-4 flex flex-col justify-between shadow-xs hover:border-[#D0C9BD] transition group">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#666D67] font-semibold mb-2">
            <span>SYSTEM HEALTH</span>
            <Activity className="w-4 h-4 text-[#2E7D47]" />
          </div>
          <div className="space-y-1 my-1 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#666D67] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Model
              </span>
              <span className="font-semibold text-[#1C201C]">Operational</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#666D67] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Data Streams
              </span>
              <span className="font-mono font-semibold text-[#1C201C]">98%</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#666D67] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Last Assimilation
              </span>
              <span className="font-mono text-[#666D67]">20:58 IST</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center space-x-1 text-xs font-bold text-[#1C201C] group-hover:text-[#2E7D47] mt-3 pt-2 border-t border-[#EFEBE3] transition text-left"
        >
          <span>View Health Monitor</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

    </div>
  );
};
