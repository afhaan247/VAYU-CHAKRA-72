import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, ChevronRight, FileCheck, Truck, Factory, Ban, Siren } from 'lucide-react';
import { GRAP_STAGES } from '../data/stations';

interface Props {
  currentAqi: number;
  peak72hAqi: number;
}

export const GrapAdvisoryPanel: React.FC<Props> = ({ currentAqi, peak72hAqi }) => {
  // Determine active stage based on highest forecast AQI
  const effectiveAqi = Math.max(currentAqi, peak72hAqi);
  
  const getActiveStageNumber = (aqi: number) => {
    if (aqi > 450) return 4;
    if (aqi > 400) return 3;
    if (aqi > 300) return 2;
    if (aqi > 200) return 1;
    return 0;
  };

  const activeStage = getActiveStageNumber(effectiveAqi);
  const [selectedStageTab, setSelectedStageTab] = useState<number>(Math.max(1, activeStage));

  const currentStageObj = GRAP_STAGES.find((s) => s.stage === selectedStageTab) || GRAP_STAGES[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              CAQM Graded Response Action Plan (GRAP) Advisory
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Statutory emergency mitigation protocol for Delhi & NCR Districts
            </p>
          </div>
        </div>

        {/* Active Stage Pill */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Mandated Status:</span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-wide ${
            activeStage === 4 ? 'bg-rose-900 text-white animate-pulse' :
            activeStage === 3 ? 'bg-red-700 text-white' :
            activeStage === 2 ? 'bg-orange-600 text-white' :
            activeStage === 1 ? 'bg-amber-600 text-white' :
            'bg-emerald-700 text-white'
          }`}>
            {activeStage > 0 ? `STAGE ${activeStage} ENFORCED` : 'NORMAL SURVEILLANCE'}
          </span>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {GRAP_STAGES.map((s) => {
            const isMandated = activeStage === s.stage;
            const isSelected = selectedStageTab === s.stage;
            return (
              <button
                key={s.stage}
                onClick={() => setSelectedStageTab(s.stage)}
                className={`p-2.5 rounded-lg border text-left transition relative flex flex-col justify-between ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isMandated && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                  {s.roman}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  AQI {s.aqiRange}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail & Statutory Directives */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${currentStageObj.badgeClass}`}>
                {currentStageObj.title}
              </span>
              {activeStage === currentStageObj.stage && (
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold uppercase">
                  ● Currently Activated by Forecast
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Target Authorities: Police, MCD, PWD, Transport
            </span>
          </div>

          <div className="space-y-2">
            {currentStageObj.actions.map((act, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs">
                <div className="mt-0.5 p-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-snug font-normal">
                  {act}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Section 12, Commission for Air Quality Management in NCR Act, 2021</span>
            <span className="text-blue-700 dark:text-cyan-400 font-medium">Auto-Synced with CAQM Sub-Committee</span>
          </div>
        </div>

      </div>

    </div>
  );
};
