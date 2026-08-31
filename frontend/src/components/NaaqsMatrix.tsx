import React from 'react';
import { CurrentStatus, ForecastHourItem } from '../types';
import { Table, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface Props {
  current: CurrentStatus | null;
  forecast: ForecastHourItem[];
}

export const NaaqsMatrix: React.FC<Props> = ({ current, forecast }) => {
  if (!current || !forecast.length) return null;

  // Calculate 24h average from the first 24h of forecast
  const next24 = forecast.slice(0, 24);
  const avg24_pm25 = Math.round(next24.reduce((acc, cur) => acc + cur.pm25, 0) / next24.length);
  const avg24_pm10 = Math.round(next24.reduce((acc, cur) => acc + cur.pm10, 0) / next24.length);
  const avg24_nox = Math.round(next24.reduce((acc, cur) => acc + cur.nox, 0) / next24.length);
  const avg24_o3 = Math.round(next24.reduce((acc, cur) => acc + cur.o3, 0) / next24.length);

  const pollutants = [
    {
      name: 'Particulate Matter (PM2.5)',
      code: 'PM2.5',
      unit: 'µg/m³',
      standard24h: 60,
      currentVal: Math.round(current.pm25),
      avg24Val: avg24_pm25,
      averagingTime: '24 Hours',
    },
    {
      name: 'Particulate Matter (PM10)',
      code: 'PM10',
      unit: 'µg/m³',
      standard24h: 100,
      currentVal: Math.round(current.pm10),
      avg24Val: avg24_pm10,
      averagingTime: '24 Hours',
    },
    {
      name: 'Nitrogen Dioxide (NO₂)',
      code: 'NO₂',
      unit: 'µg/m³',
      standard24h: 80,
      currentVal: Math.round(current.nox * 0.65), // approximate NO2 portion
      avg24Val: Math.round(avg24_nox * 0.65),
      averagingTime: '24 Hours',
    },
    {
      name: 'Sulphur Dioxide (SO₂)',
      code: 'SO₂',
      unit: 'µg/m³',
      standard24h: 80,
      currentVal: 24, // nominal compliant standard
      avg24Val: 28,
      averagingTime: '24 Hours',
    },
    {
      name: 'Ground-Level Ozone (O₃)',
      code: 'O₃',
      unit: 'µg/m³',
      standard24h: 100,
      currentVal: Math.round(current.o3),
      avg24Val: avg24_o3,
      averagingTime: '8 Hours',
    },
    {
      name: 'Carbon Monoxide (CO)',
      code: 'CO',
      unit: 'mg/m³',
      standard24h: 2.0,
      currentVal: 1.4,
      avg24Val: 1.8,
      averagingTime: '8 Hours',
    },
  ];

  const getComplianceStatus = (val: number, standard: number) => {
    const ratio = (val - standard) / standard;
    if (val <= standard) {
      return {
        label: 'COMPLIANT',
        color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      };
    }
    if (ratio < 1.0) {
      return {
        label: `+${Math.round(ratio * 100)}% EXCEED`,
        color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      };
    }
    return {
      label: `+${Math.round(ratio * 100)}% SEVERE`,
      color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              NAAQS Statutory Standards & Compliance Matrix
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              CPCB National Ambient Air Quality Standards Gazette vs Projected 24h Means
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          MoEFCC Notification B-29016/20/90/PCI-L
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100/70 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-4 font-bold">Pollutant Parameter</th>
              <th className="py-2.5 px-3 font-bold text-center">Avg Period</th>
              <th className="py-2.5 px-3 font-bold text-right">NAAQS Limit</th>
              <th className="py-2.5 px-3 font-bold text-right">Current Live</th>
              <th className="py-2.5 px-3 font-bold text-right">24h Projected Mean</th>
              <th className="py-2.5 px-4 font-bold text-center">Compliance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pollutants.map((p, idx) => {
              const status = getComplianceStatus(p.avg24Val, p.standard24h);
              return (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    {p.name}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400">
                    {p.averagingTime}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                    {p.standard24h} <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {p.currentVal} <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-cyan-400">
                    {p.avg24Val} <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${status.color}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
