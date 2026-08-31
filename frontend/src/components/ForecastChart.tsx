import React, { useState } from 'react';
import { ForecastHourItem } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  Table, 
  LineChart, 
  Download, 
  AlertTriangle,
  Play
} from 'lucide-react';

interface Props {
  forecast: ForecastHourItem[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
  stationMultiplier: number;
}

export const ForecastChart: React.FC<Props> = ({ 
  forecast, 
  selectedHour, 
  onSelectHour,
  stationMultiplier 
}) => {
  const [activeTab, setActiveTab] = useState<'aqi' | 'pm25' | 'pm10' | 'o3' | 'nox' | 'physics'>('aqi');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Adjust chart data with station multiplier
  const chartData = forecast.map((item) => {
    const adjAqi = Math.round(item.aqi * stationMultiplier);
    const adjPm25 = Math.round(item.pm25 * stationMultiplier);
    const adjPm10 = Math.round(item.pm10 * stationMultiplier);
    const adjNox = Math.round(item.nox * stationMultiplier);
    const adjO3 = Math.round(item.o3 * stationMultiplier);
    const adjP10 = Math.round(item.pm25_p10 * stationMultiplier);
    const adjP90 = Math.round(item.pm25_p90 * stationMultiplier);

    return {
      hour: item.hour,
      label: `+${item.hour}h`,
      timestamp: item.timestamp,
      aqi: adjAqi,
      pm25: adjPm25,
      pm25_p10: adjP10,
      pm25_p90: adjP90,
      pm10: adjPm10,
      o3: adjO3,
      nox: adjNox,
      pbl_height: Math.round(item.pbl_height),
      ventilation_index: Math.round(item.ventilation_index),
      inversion_index: Number(item.inversion_index.toFixed(2)),
      fire_influence: Number(item.fire_influence.toFixed(1)),
      primary_cause: item.primary_cause,
      color: item.color,
    };
  });

  const getTabConfig = () => {
    switch (activeTab) {
      case 'aqi':
        return { key: 'aqi', title: '72-Hour CPCB AQI Trajectory', shortTitle: 'AQI Forecast', unit: 'AQI Index', color: '#1D4ED8' };
      case 'pm25':
        return { key: 'pm25', title: '72-Hour PM2.5 (with 90% Ensemble Uncertainty)', shortTitle: 'PM2.5 Trajectory', unit: 'µg/m³', color: '#D90429' };
      case 'pm10':
        return { key: 'pm10', title: '72-Hour PM10 Trajectory', shortTitle: 'PM10 Trajectory', unit: 'µg/m³', color: '#E36414' };
      case 'o3':
        return { key: 'o3', title: '72-Hour Ground-Level Ozone (O₃)', shortTitle: 'Ozone (O₃)', unit: 'µg/m³', color: '#059669' };
      case 'nox':
        return { key: 'nox', title: '72-Hour Nitrogen Oxides (NOx)', shortTitle: 'NOx Trajectory', unit: 'µg/m³', color: '#7C3AED' };
      case 'physics':
        return { key: 'ventilation_index', title: '72-Hour Ventilation Rate (Vc)', shortTitle: 'Ventilation (Vc)', unit: 'm²/s', color: '#0284C7' };
    }
  };

  const config = getTabConfig();
  const peakHourItem = chartData.reduce((max, item) => (item.aqi > max.aqi ? item : max), chartData[0]);

  const handleExportCsv = () => {
    const headers = ['Hour,Timestamp,AQI,PM2.5(ug/m3),PM10(ug/m3),NOx(ug/m3),O3(ug/m3),PBL(m),VentilationIndex(m2/s),InversionIndex,PrimaryCause\n'];
    const rows = chartData.map(d => 
      `${d.hour},"${d.timestamp}",${d.aqi},${d.pm25},${d.pm10},${d.nox},${d.o3},${d.pbl_height},${d.ventilation_index},${d.inversion_index},"${d.primary_cause}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VAYU_CHAKRA_72_FORECAST_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
      
      {/* Top Header Controls */}
      <div className="px-3.5 sm:px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-700 dark:text-sky-400 flex-shrink-0" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
              <span className="sm:hidden">{config.shortTitle}</span>
              <span className="hidden sm:inline">{config.title}</span>
            </h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Physics-guided multi-variable atmospheric forecast (+1h to +72h)
          </p>
        </div>

        {/* View mode toggle & CSV export */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-mono">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 text-[11px] sm:text-xs font-semibold transition ${
                viewMode === 'chart' 
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 text-[11px] sm:text-xs font-semibold transition ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-mono font-medium transition"
            title="Download CSV dataset"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Parameter Tabs (Touch horizontally scrollable) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
        <div className="flex items-center space-x-1.5 min-w-max">
          {(['aqi', 'pm25', 'pm10', 'o3', 'nox', 'physics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold uppercase transition ${
                activeTab === tab
                  ? 'bg-[#0F2A4A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              {tab === 'physics' ? 'Ventilation (Vc)' : tab}
            </button>
          ))}
        </div>

        {/* Selected Hour Stamp */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono min-w-max pl-2">
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Inspecting:</span>
          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
            Hour +{selectedHour}
          </span>
        </div>
      </div>

      {/* Main Body: Chart or Tabular View */}
      {viewMode === 'chart' ? (
        <div className="p-3 sm:p-4">
          <div className="h-60 sm:h-72 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    onSelectHour(state.activePayload[0].payload.hour);
                  }
                }}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUncertaintyLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  interval={5}
                />
                
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  domain={['auto', 'auto']}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 sm:p-3 rounded-lg shadow-xl font-mono text-xs z-50 max-w-xs">
                          <p className="text-blue-700 dark:text-cyan-400 font-bold mb-1">{data.timestamp} (+{data.hour}h)</p>
                          <p className="text-slate-800 dark:text-white font-semibold">
                            AQI: <span className="font-bold" style={{ color: data.color }}>{data.aqi}</span>
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">PM2.5: {data.pm25} µg/m³ | PM10: {data.pm10} µg/m³</p>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">PBL: {data.pbl_height}m | Vc: {data.ventilation_index} m²/s</p>
                          <p className="text-[10px] mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-500 font-sans italic truncate">
                            Cause: {data.primary_cause}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* AQI Reference Lines */}
                {activeTab === 'aqi' && (
                  <>
                    <ReferenceLine y={200} stroke="#E5A900" strokeDasharray="3 3" />
                    <ReferenceLine y={300} stroke="#E36414" strokeDasharray="3 3" />
                    <ReferenceLine y={400} stroke="#D90429" strokeDasharray="3 3" />
                  </>
                )}

                {/* Selected Hour Vertical Line */}
                <ReferenceLine x={`+${selectedHour}h`} stroke="#0F2A4A" strokeWidth={2} strokeDasharray="2 2" />

                {/* PM2.5 Uncertainty Shading */}
                {activeTab === 'pm25' && (
                  <Area
                    type="monotone"
                    dataKey="pm25_p90"
                    stroke="none"
                    fill="url(#colorUncertaintyLight)"
                    name="90% Ensemble Bound"
                  />
                )}

                {/* Main Forecasting Line */}
                <Line
                  type="monotone"
                  dataKey={config.key}
                  stroke={config.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: config.color, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Jump Timeline Scrubber */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] sm:text-[11px] flex items-center gap-1">
              <Play className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span>Timeline Jumps:</span>
            </span>

            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 font-mono text-[10px] sm:text-[11px] w-full sm:w-auto">
              {[1, 6, 12, 24, 48, 72].map((h) => (
                <button
                  key={h}
                  onClick={() => onSelectHour(h)}
                  className={`px-2 py-1 sm:py-0.5 rounded border transition min-h-[30px] flex items-center justify-center ${
                    selectedHour === h
                      ? 'bg-blue-600 text-white border-blue-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  +{h}h
                </button>
              ))}

              <button
                onClick={() => onSelectHour(peakHourItem.hour)}
                className="px-2 py-1 sm:py-0.5 rounded border border-red-300 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold hover:bg-red-100 flex items-center space-x-1 min-h-[30px]"
                title="Jump to peak predicted pollution hour"
              >
                <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                <span>Peak Smog (+{peakHourItem.hour}h: {peakHourItem.aqi})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tabular View */
        <div className="max-h-80 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[600px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 uppercase sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Horizon</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3 text-right">AQI</th>
                <th className="py-2 px-3 text-right">PM2.5</th>
                <th className="py-2 px-3 text-right">PM10</th>
                <th className="py-2 px-3 text-right">NOx</th>
                <th className="py-2 px-3 text-right">PBL (m)</th>
                <th className="py-2 px-3 text-right">Vc (m²/s)</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {chartData.map((d) => (
                <tr 
                  key={d.hour} 
                  className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition ${
                    selectedHour === d.hour ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold' : ''
                  }`}
                >
                  <td className="py-1.5 px-3 font-bold text-blue-800 dark:text-blue-300">+{d.hour}h</td>
                  <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">{d.timestamp}</td>
                  <td className="py-1.5 px-3 text-right font-bold" style={{ color: d.color }}>{d.aqi}</td>
                  <td className="py-1.5 px-3 text-right text-slate-800 dark:text-slate-200">{d.pm25}</td>
                  <td className="py-1.5 px-3 text-right text-slate-800 dark:text-slate-200">{d.pm10}</td>
                  <td className="py-1.5 px-3 text-right text-slate-800 dark:text-slate-200">{d.nox}</td>
                  <td className="py-1.5 px-3 text-right text-slate-700 dark:text-slate-300">{d.pbl_height}</td>
                  <td className="py-1.5 px-3 text-right text-slate-700 dark:text-slate-300">{d.ventilation_index}</td>
                  <td className="py-1.5 px-3 text-center">
                    <button
                      onClick={() => onSelectHour(d.hour)}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-slate-300 dark:border-slate-700"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
