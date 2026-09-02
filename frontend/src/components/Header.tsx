import React, { useState, useEffect } from 'react';
import { 
  Menu, 
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

  const pageHeaders: Record<AppPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Overview',
      subtitle: 'Real-time telemetry & system status',
    },
    map3d: {
      title: '3D Air Quality Map',
      subtitle: 'Real-time pollution distribution in 3D atmosphere',
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

  const currentHeader = pageHeaders[activePage] || pageHeaders.overview;

  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap bg-transparent">
      
      {/* Left: Page Title & Subtitle */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl border border-[#DCD6CB] bg-[#FCFAF7] text-[#1C201C] hover:bg-[#F3EFE6] transition shadow-xs flex-shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C201C] tracking-tight">
            {currentHeader.title}
          </h1>
          <p className="text-xs text-[#666D67] font-medium tracking-tight mt-0.5">
            {currentHeader.subtitle}
          </p>
        </div>
      </div>

      {/* Right Toolbar: Station Dropdown, IST Clock, Gazette Button & Quick Actions */}
      <div className="flex items-center space-x-2.5 text-xs flex-shrink-0">
        
        {/* Station Selector Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#FCFAF7] hover:bg-[#F5F2EC] border border-[#DCD6CB] font-semibold text-[#1C201C] transition text-xs shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span>
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{selectedStation.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#666D67] ml-0.5 flex-shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {isStationDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/30 sm:hidden"
                onClick={() => setIsStationDropdownOpen(false)}
              />
              
              <div className="fixed sm:absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-1.5 sm:w-96 bg-[#FCFAF7] rounded-2xl shadow-xl border border-[#DCD6CB] py-2 z-50 max-h-[75vh] sm:max-h-80 overflow-y-auto">
                <div className="px-4 py-2 text-[11px] font-mono font-bold uppercase text-[#666D67] border-b border-[#EBE6DC] flex items-center justify-between">
                  <span>Delhi-NCR CAAQMS Network</span>
                  <span className="sm:hidden text-xs text-[#2E7D47] font-bold cursor-pointer" onClick={() => setIsStationDropdownOpen(false)}>Close</span>
                </div>
                {DELHI_NCR_STATIONS.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      onSelectStation(station);
                      setIsStationDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-[#F3EFE6] transition border-b border-[#F0EBE0] last:border-b-0 ${
                      selectedStation.id === station.id ? 'bg-[#EAE4D7] text-[#1C201C] font-bold' : 'text-[#2C322D]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="truncate font-semibold">{station.name}</span>
                      </div>
                      <p className="text-[10px] text-[#666D67] font-normal truncate mt-0.5">
                        {station.state} • {station.agency} • {station.type}
                      </p>
                    </div>
                    {selectedStation.id === station.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#2E7D47] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live Clock Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#FCFAF7] border border-[#DCD6CB] text-[#1C201C] text-xs font-mono font-medium shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#666D67]" />
          <span>{istTime || '31 Aug, 21:04:41 IST'}</span>
        </div>

        {/* Gazette Bulletin Button */}
        <button
          onClick={onOpenGazette}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#233027] hover:bg-[#2C3D31] text-[#F3EFE6] font-semibold text-xs border border-[#344438] shadow-xs transition"
        >
          <FileText className="w-3.5 h-3.5 text-[#B8C7BA]" />
          <span>Gazette Bulletin</span>
        </button>

        {/* Refresh Circular Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-[#FCFAF7] hover:bg-[#F3EFE6] border border-[#DCD6CB] text-[#1C201C] transition shadow-xs disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2E7D47]' : 'text-[#444C45]'}`} />
        </button>

        {/* Theme Toggle Circular Button */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-xl bg-[#FCFAF7] hover:bg-[#F3EFE6] border border-[#DCD6CB] text-[#1C201C] transition shadow-xs"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#444C45]" />}
        </button>

      </div>
    </header>
  );
};
