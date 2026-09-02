import React, { useEffect, useState } from 'react';
import { fetchMLMetrics } from '../api';
import { MLMetricsResponse, MLHorizonMetric } from '../types';
import { Cpu, TrendingUp, Zap, Shield, BarChart3, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const R2_COLOR = (r2: number) => {
  if (r2 >= 0.90) return 'text-emerald-600 dark:text-emerald-400';
  if (r2 >= 0.80) return 'text-sky-600 dark:text-sky-400';
  if (r2 >= 0.65) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const R2_BG = (r2: number) => {
  if (r2 >= 0.90) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
  if (r2 >= 0.80) return 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700';
  if (r2 >= 0.65) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
  return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
};

const LEVEL_BADGE = (level: string) => {
  if (level.includes('8') || level.includes('7')) return 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white';
  if (level.includes('6') || level.includes('5')) return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white';
  return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white';
};

const POLLUTANTS = ['PM2.5', 'PM10', 'O3', 'NOx'];
const HORIZONS = [
  { key: 'h24', label: '+24h' },
  { key: 'h48', label: '+48h' },
  { key: 'h72', label: '+72h' },
];

interface MetricCellProps {
  metric?: MLHorizonMetric;
}

const MetricCell: React.FC<MetricCellProps> = ({ metric }) => {
  if (!metric) return <td className="px-2 py-2 text-center text-slate-400 text-xs">—</td>;
  return (
    <td className="px-2 py-2">
      <div className={`rounded-md border px-2 py-1 text-center ${R2_BG(metric.r2)}`}>
        <div className={`text-xs font-bold font-mono ${R2_COLOR(metric.r2)}`}>
          R² {metric.r2.toFixed(3)}
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          MAE {metric.mae.toFixed(1)} µg/m³
        </div>
      </div>
    </td>
  );
};

export const MLDiagnosticsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<MLMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMLMetrics()
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov p-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading ML diagnostics...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl shadow-gov p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">ML Diagnostics Unavailable</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Run <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">python train_and_seed.py</code> to generate metrics.
          </p>
        </div>
      </div>
    );
  }

  // Compute average R² across all horizons and pollutants
  let r2Values: number[] = [];
  HORIZONS.forEach(h => {
    POLLUTANTS.forEach(p => {
      const m = metrics.evaluation_metrics?.[h.key]?.[p];
      if (m) r2Values.push(m.r2);
    });
  });
  const avgR2 = r2Values.length ? r2Values.reduce((a, b) => a + b, 0) / r2Values.length : 0;
  const minMaePM25 = Math.min(...HORIZONS.map(h => metrics.evaluation_metrics?.[h.key]?.['PM2.5']?.mae ?? 999));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-gov overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            ML Forecaster Diagnostics
          </h3>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${LEVEL_BADGE(metrics.model_level)}`}>
          {metrics.model_level.split(':')[0]}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Model Info Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg py-2 px-3">
            <span className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-300">
              {metrics.parameters_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-0.5">Parameters</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-lg py-2 px-3">
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {avgR2.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-0.5">Avg R²</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/50 rounded-lg py-2 px-3">
            <span className="text-lg font-bold font-mono text-sky-700 dark:text-sky-300">
              {minMaePM25.toFixed(1)} µg
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-0.5">PM₂.₅ Best MAE</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-lg py-2 px-3">
            <span className="text-lg font-bold font-mono text-violet-700 dark:text-violet-300">
              {metrics.physics_compliance_rate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-0.5">Physics Valid</span>
          </div>
        </div>

        {/* Architecture Tag */}
        <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          <Zap className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
            {metrics.architecture}
          </p>
        </div>

        {/* Evaluation Metrics Table */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Multi-Horizon Validation Scores
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">Pollutant</th>
                  {HORIZONS.map(h => (
                    <th key={h.key} className="px-2 py-2 text-center text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {POLLUTANTS.map(p => (
                  <tr key={p} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{p}</span>
                    </td>
                    {HORIZONS.map(h => (
                      <MetricCell key={h.key} metric={metrics.evaluation_metrics?.[h.key]?.[p]} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right font-mono">
            {metrics.trained_epochs} epochs · {metrics.input_features_count} input features · {metrics.forecast_horizon_hours}h horizon
          </p>
        </div>

        {/* Training Loss Sparkline */}
        {metrics.training_loss_history && metrics.training_loss_history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Training Convergence
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Final Loss: {metrics.training_loss_history[metrics.training_loss_history.length - 1].toFixed(4)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 p-2 h-14 flex items-end gap-px">
              {metrics.training_loss_history.map((loss, idx) => {
                const maxLoss = Math.max(...metrics.training_loss_history);
                const minLoss = Math.min(...metrics.training_loss_history);
                const range = maxLoss - minLoss || 1;
                const heightPct = 100 - ((loss - minLoss) / range) * 100;
                const isLast = idx === metrics.training_loss_history.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all ${isLast ? 'bg-emerald-500' : 'bg-indigo-400 dark:bg-indigo-600'} opacity-80`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                    title={`Epoch ${idx + 1}: ${loss.toFixed(4)}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Status Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {metrics.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Target Normalization · MCDO Uncertainty · Physics Composite Loss
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
