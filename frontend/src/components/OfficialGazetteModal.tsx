import React from 'react';
import { CurrentStatus, ForecastResponse, MonitoringStation } from '../types';
import { 
  Printer, 
  X, 
  FileText
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: CurrentStatus | null;
  forecastData: ForecastResponse | null;
  station: MonitoringStation;
}

export const OfficialGazetteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  current,
  forecastData,
  station,
}) => {
  if (!isOpen || !current || !forecastData) return null;

  const handlePrint = () => {
    window.print();
  };

  const peakForecast = forecastData.forecast.reduce(
    (max, f) => (f.aqi > max.aqi ? f : max),
    forecastData.forecast[0]
  );

  const avgForecastAqi = forecastData.overall_72h_avg_aqi;
  const bulletinId = `CAQM/DSS-72H/2026/OP-082/${new Date().getTime().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      
      {/* Modal Container */}
      <div className="bg-white text-slate-900 rounded-2xl sm:rounded-xl shadow-2xl max-w-4xl w-full border border-slate-300 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Action Header Bar (No Print) */}
        <div className="no-print bg-[#0F2A4A] text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 flex-shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm truncate">
              Official Government Gazette Bulletin • CAQM & MoEFCC
            </h3>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-4 sm:p-8 overflow-y-auto font-sans leading-relaxed text-xs">
          
          {/* Official Document Masthead */}
          <div className="text-center border-b-2 border-slate-900 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="inline-block mb-1">
              <span className="text-sm sm:text-lg font-serif font-black tracking-widest block text-[#0F2A4A]">
                भारत सरकार | GOVERNMENT OF INDIA
              </span>
              <span className="text-[11px] sm:text-xs font-serif font-bold text-slate-700 block">
                पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय
              </span>
              <span className="text-[11px] sm:text-xs font-serif font-bold text-slate-700 block">
                MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-600 block mt-0.5">
                COMMISSION FOR AIR QUALITY MANAGEMENT IN NCR & ADJOINING AREAS
              </span>
            </div>
            
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] font-mono border-t border-slate-300 pt-2 text-slate-600 gap-1">
              <span><strong>Gazette Ref:</strong> {bulletinId}</span>
              <span><strong>Date of Issue:</strong> {dateStr}</span>
              <span><strong>Security:</strong> OFFICIAL USE ONLY</span>
            </div>
          </div>

          {/* Bulletin Title */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xs sm:text-base font-extrabold uppercase tracking-wide text-slate-900 underline decoration-slate-400 underline-offset-4">
              72-HOUR ATMOSPHERIC AIR QUALITY FORECAST & STATUTORY GRAP DIRECTIVE BULLETIN
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 font-mono mt-1">
              Location: <strong>{station.name} [{station.code}]</strong> • Baseline Time: {current.timestamp}
            </p>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-6 text-center font-mono">
            <div className="p-2.5 sm:p-3 border border-slate-300 rounded-lg bg-slate-50">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase">Current Recorded AQI</span>
              <span className="text-xl sm:text-2xl font-black text-red-700 block">{current.aqi}</span>
              <span className="text-[10px] font-bold text-slate-700">{current.category}</span>
            </div>

            <div className="p-2.5 sm:p-3 border border-slate-300 rounded-lg bg-slate-50">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase">72-Hour Maximum Forecast</span>
              <span className="text-xl sm:text-2xl font-black text-rose-800 block">{peakForecast.aqi}</span>
              <span className="text-[10px] font-bold text-slate-700">Expected at +{peakForecast.hour}h ({peakForecast.timestamp})</span>
            </div>

            <div className="p-2.5 sm:p-3 border border-slate-300 rounded-lg bg-slate-50">
              <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase">72h Projected Average</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 block">{avgForecastAqi}</span>
              <span className="text-[10px] font-bold text-slate-700">Multi-Day Trajectory Mean</span>
            </div>
          </div>

          {/* Section 1: Scientific Assessment */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-mono">
              1. Meteorological & Boundary Layer Diagnostics
            </h3>
            <p className="text-slate-700 mb-2 leading-relaxed text-[11px] sm:text-xs">
              Physics-guided ensemble forecasting indicates that atmospheric conditions over Delhi-NCR will experience nocturnal boundary layer compression down to <strong>{Math.round(current.pbl_height)} meters</strong> with surface inversion index of <strong>{current.inversion_index.toFixed(2)}</strong>. Wind speeds averaging <strong>{current.wind_speed} m/s</strong> from <strong>{current.wind_direction}° (North-West)</strong> continue to facilitate the advective transport of upstream biomass combustion plumes.
            </p>
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded border border-slate-200 font-mono text-[10px] sm:text-[11px]">
              <strong>Primary Driving Vector:</strong> {forecastData.dominant_period_cause}
            </div>
          </div>

          {/* Section 2: Statutory Advisory & Enforcement */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-mono">
              2. Mandated Graded Response Action Plan (GRAP) Enforcement
            </h3>
            <p className="text-slate-700 mb-2 leading-relaxed text-[11px] sm:text-xs">
              In exercise of powers under Section 12 of the CAQM in NCR & Adjoining Areas Act, 2021, all relevant enforcement agencies (Traffic Police, Municipal Corporations, State Pollution Control Boards) are hereby ordered to enforce:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px] sm:text-xs">
              <li>Immediate stoppage of all non-essential construction and demolition activities.</li>
              <li>Strict prohibition on the movement of non-BS-VI diesel vehicles in the municipal boundaries.</li>
              <li>Continuous deployment of mechanical sweepers and anti-smog mist guns across 13 priority hotspots.</li>
              <li>Mandatory 50% work-from-home capacity advisory for commercial and non-emergency government entities.</li>
            </ul>
          </div>

          {/* Official Sign-off */}
          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-end justify-between font-mono text-[10px] sm:text-[11px] gap-4 sm:gap-0">
            <div>
              <p className="text-slate-500">Document generated automatically by:</p>
              <p className="font-bold text-slate-800">VAYU-CHAKRA 72 Operational Decision Support System</p>
              <p className="text-slate-500">Ministry of Environment, Forest & Climate Change</p>
            </div>

            <div className="sm:text-right">
              <div className="h-8 sm:h-10 w-28 border-b border-dashed border-slate-400 mb-1 inline-block"></div>
              <p className="font-bold text-slate-800">Member Secretary / Authorized Signatory</p>
              <p className="text-slate-500">Commission for Air Quality Management (NCR)</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
