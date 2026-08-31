import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  MapPin, 
  Clock, 
  FileText, 
  RefreshCw, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ChevronDown
} from 'lucide-react';
import { MonitoringStation } from '../types';
import { DELHI_NCR_STATIONS } from '../data/stations';
import { AppPage } from './Sidebar';

interface HeaderProps {
  selectedStation: MonitoringStation;
  onSelectStation: (station: MonitoringStation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenGazette: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  lastUpdated: string;
  activePage: AppPage;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedStation,
  onSelectStation,
  onRefresh,
  isLoading,
  onOpenGazette,
  isDarkMode,
  onToggleTheme,
  lastUpdated,
  activePage,
  onOpenMobileSidebar,
}) => {
  const [istTime, setIstTime] = useState<string>('');
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', options).format(now) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<AppPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Overview & Live CAAQMS Feed',
      subtitle: 'Real-time telemetry, 72h snapshot & key atmospheric metrics',
    },
    forecast: {
      title: '72-Hour Atmospheric Forecaster',
      subtitle: 'Physics-constrained multi-variable predictive trajectory',
    },
    physics: {
      title: 'Scientific Diagnostics ("WHY" Engine)',
      subtitle: 'Reduced-order boundary layer attribution & administrative directives',
    },
    compliance: {
      title: 'CAQM GRAP & NAAQS Standards Matrix',
      subtitle: 'Statutory emergency mandates & 24h legal compliance',
    },
    simulator: {
      title: '"What-If" Policy Scenario Simulator',
      subtitle: 'Test interventional policy impacts against baseline 72h AQI',
    },
  };

  const currentPage = pageTitles[activePage] || pageTitles.overview;

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs transition-colors">
      
      {/* Sovereign National Color Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] border-b border-slate-200/50 dark:border-slate-800/50"></div>

      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Menu Hamburger & Page Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-xs flex-shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0F2A4A] dark:text-sky-300 tracking-tight truncate">
              {currentPage.title}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">
              {currentPage.subtitle}
            </p>
          </div>
        </div>

        {/* Right Toolbar: Station Dropdown, IST Clock & Quick Actions */}
        <div className="flex items-center space-x-2 text-xs font-mono flex-shrink-0">
          
          {/* Station Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-slate-800 dark:text-slate-200 transition text-xs shadow-2xs max-w-[150px] sm:max-w-[240px]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <span className="truncate text-left">{selectedStation.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5 flex-shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isStationDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 sm:hidden"
                  onClick={() => setIsStationDropdownOpen(false)}
                />
                
                <div className="fixed sm:absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-1 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 max-h-[75vh] sm:max-h-72 overflow-y-auto">
                  <div className="px-4 py-2 text-[11px] sm:text-[10px] font-bold font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span>Delhi-NCR CAAQMS Network</span>
                    <span className="sm:hidden text-xs text-blue-600" onClick={() => setIsStationDropdownOpen(false)}>Done</span>
                  </div>
                  {DELHI_NCR_STATIONS.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        onSelectStation(station);
                        setIsStationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 sm:py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 active:bg-blue-50 dark:active:bg-blue-900/40 transition border-b sm:border-b-0 border-slate-100 dark:border-slate-800/60 ${
                        selectedStation.id === station.id ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate">{station.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                          {station.state} • {station.agency} • {station.type}
                        </p>
                      </div>
                      {selectedStation.id === station.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Live Clock (tablet/desktop) */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{istTime || 'IST'}</span>
          </div>

          {/* Gazette Modal Button (desktop) */}
          <button
            onClick={onOpenGazette}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0F2A4A] hover:bg-[#163b65] text-white font-medium text-xs shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>Gazette Bulletin</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium text-xs transition disabled:opacity-50 flex items-center space-x-1"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden xl:inline">Refresh</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title="Toggle Light/Dark Theme"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

        </div>

      </div>
    </header>
  );
};
