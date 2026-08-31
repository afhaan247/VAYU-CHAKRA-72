import React, { useEffect, useState } from 'react';
import { HourExplanation, ForecastHourItem } from '../types';
import { fetchHourExplanation } from '../api';
import { 
  HelpCircle, 
  Layers, 
  Wind, 
  Flame, 
  ThermometerSnowflake, 
  CloudRain, 
  ArrowUpCircle, 
  AlertTriangle, 
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface Props {
  selectedHour: number;
  forecastItem: ForecastHourItem | null;
  stationMultiplier: number;
}

export const WhyExplanation: React.FC<Props> = ({ 
  selectedHour, 
  forecastItem,
  stationMultiplier 
}) => {
  const [explanation, setExplanation] = useState<HourExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchHourExplanation(selectedHour)
      .then((data) => {
        if (isMounted) {
          setExplanation(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedHour]);

  const getDriverIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4 text-blue-600 dark:text-sky-400" />;
      case 'Wind': return <Wind className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'ThermometerSnowflake': return <ThermometerSnowflake className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'CloudRain': return <CloudRain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default: return <ArrowUpCircle className="w-4 h-4 text-blue-600 dark:text-sky-400" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">HIGH IMPACT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">MODERATE</span>;
    }
  };

  // Generate dynamic government administrative directive based on the primary diagnostic trigger
  const getAdministrativeDirective = () => {
    if (!forecastItem) return null;
    const cause = forecastItem.primary_cause.toLowerCase();
    
    if (cause.includes('fire') || cause.includes('smoke') || cause.includes('stubble')) {
      return {
        title: 'Priority Inter-State Enforcement Directive',
        authority: 'CAQM Joint Surveillance Cell',
        action: 'Activate satellite thermal anomaly ground patrols in Punjab/Haryana; deploy border anti-smog water mist canons along Western Peripheral Expressway.',
        icon: <Flame className="w-4 h-4 text-red-600" />
      };
    }
    if (cause.includes('inversion') || cause.includes('pbl') || cause.includes('stagnation')) {
      return {
        title: 'Nocturnal Stagnation Mitigation Directive',
        authority: 'Municipal Corporation of Delhi (MCD / NDMC)',
        action: 'Mandate zero night-time road excavation; enforce 24-hour ban on unpaved C&D storage and ramp up mechanical dust-suppressant misting between 02:00-08:00 hrs.',
        icon: <Layers className="w-4 h-4 text-amber-600" />
      };
    }
    if (cause.includes('rain') || cause.includes('dispersion') || cause.includes('flushing')) {
      return {
        title: 'Atmospheric Washout Monitoring',
        authority: 'Central Pollution Control Board',
        action: 'Favorable dispersion window active. Maintain standard surveillance and clear stormwater drains to prevent secondary particulate resuspension.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      };
    }
    return {
      title: 'Standard Urban Emission Vigilance',
      authority: 'Delhi Traffic Police & DPCC',
      action: 'Conduct targeted vehicular emission testing at 13 key congestion bottlenecks and verify commercial boiler fuel compliance in Mayapuri/Wazirpur.',
      icon: <ShieldAlert className="w-4 h-4 text-blue-600" />
    };
  };

  const directive = getAdministrativeDirective();
  const adjustedAqi = forecastItem ? Math.round(forecastItem.aqi * stationMultiplier) : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov flex flex-col justify-between overflow-hidden">
      
      <div>
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Atmospheric "WHY" Diagnostic Engine
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Physics-driven attribution for Hour +{selectedHour}
              </p>
            </div>
          </div>

          {forecastItem && (
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Forecast AQI</span>
              <p className="text-base font-extrabold font-mono" style={{ color: forecastItem.color }}>
                {adjustedAqi}
              </p>
            </div>
          )}
        </div>

        {/* Diagnostic Drivers List */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          ) : explanation && explanation.diagnostic_drivers ? (
            explanation.diagnostic_drivers.map((driver, idx) => (
              <div 
                key={idx}
                className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 transition rounded-lg p-3 flex items-start space-x-3"
              >
                <div className="p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xs">
                  {getDriverIcon(driver.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {driver.title}
                    </h4>
                    {getSeverityBadge(driver.severity)}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {driver.description}
                  </p>

                  <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>Vector Impact: {driver.impact}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Select any forecast hour to display scientific drivers.</p>
          )}
        </div>
      </div>

      {/* Municipal Action Directive Box */}
      {directive && (
        <div className="p-4 pt-0">
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold font-mono text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                {directive.title}
              </span>
              <span className="text-[9px] font-mono text-blue-700 dark:text-blue-400 font-semibold">
                {directive.authority}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
              {directive.action}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
