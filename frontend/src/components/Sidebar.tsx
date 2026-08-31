import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  X, 
  Sun, 
  Moon,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Radio
} from 'lucide-react';
import { MonitoringStation } from '../types';

export type AppPage = 'overview' | 'forecast' | 'physics' | 'compliance' | 'simulator';

interface SidebarProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  selectedStation: MonitoringStation;
  grapStageNumber?: number;
  onOpenGazette: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  lastUpdated: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  selectedStation,
  grapStageNumber = 3,
  onOpenGazette,
  isDarkMode,
  onToggleTheme,
  lastUpdated,
}) => {
  const navItems: {
    id: AppPage;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview & Live Feed',
      description: 'Continuous CAAQMS telemetry',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: 'LIVE',
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      id: 'forecast',
      label: '72-Hour Forecaster',
      description: 'Multi-variable trajectory & table',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: '72h',
      badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    },
    {
      id: 'physics',
      label: 'Diagnostics ("WHY")',
      description: 'Physics-guided root causes',
      icon: <HelpCircle className="w-4 h-4" />,
      badge: 'Physics',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
    },
    {
      id: 'compliance',
      label: 'GRAP & NAAQS',
      description: 'Statutory mandates & standards',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: grapStageNumber > 0 ? `Stage ${grapStageNumber}` : 'Normal',
      badgeColor: grapStageNumber >= 3 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white',
    },
    {
      id: 'simulator',
      label: 'Policy Simulator',
      description: 'Interventional sandbox testing',
      icon: <Sliders className="w-4 h-4" />,
      badge: 'What-If',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    },
  ];

  const handleNavClick = (id: AppPage) => {
    onSelectPage(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#0B1528] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sovereign Top Stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]"></div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Ashoka Seal Badge */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F2A4A] to-[#134074] flex items-center justify-center shadow-md text-white font-serif font-black text-xs border border-blue-900 flex-shrink-0">
                <div className="text-center leading-none">
                  <span className="text-[10px] block font-mono text-amber-300">🇮🇳</span>
                  <span className="text-[8px] tracking-tight font-sans font-bold">CPCB</span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-sm font-black text-[#0F2A4A] dark:text-sky-300 tracking-tight truncate">
                    VAYU-CHAKRA 72
                  </h1>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-[#0F2A4A] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    26082
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  MoEFCC • Decision Support System
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="p-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2">
              Navigation Workspace
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-[#0F2A4A] dark:text-sky-300 font-bold border border-blue-200 dark:border-blue-800 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 block truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                          item.badgeColor || 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Station Info Box */}
          <div className="px-4 py-2 mt-auto">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500" />
                  Active Station
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CAAQMS
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {selectedStation.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                Code: {selectedStation.code} • {selectedStation.agency}
              </p>
            </div>
          </div>

        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
          {/* Gazette Action */}
          <button
            onClick={() => {
              onOpenGazette();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-[#0F2A4A] hover:bg-[#163b65] text-white font-bold text-xs shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Official Gazette Bulletin</span>
          </button>

          {/* Theme Toggle & Telemetry */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WRF-Chem Sync</span>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
