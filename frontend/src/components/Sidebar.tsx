import React from 'react';
import { 
  LayoutGrid,
  Box,
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  X, 
  Moon, 
  Sun,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { MonitoringStation } from '../types';

export type AppPage = 'overview' | 'map3d' | 'forecast' | 'physics' | 'compliance' | 'simulator';

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
  grapStageNumber = 2,
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
    badgeStyle?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview & Live Feed',
      description: 'Continuous CAAQMS telemetry',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: 'LIVE',
      badgeStyle: 'bg-[#2E7D47]/30 text-[#4ADE80] border border-[#2E7D47]/60 font-semibold',
    },
    {
      id: 'map3d',
      label: '3D Air Quality Map',
      description: 'Delhi NCR pollution visualization',
      icon: <Box className="w-4 h-4" />,
    },
    {
      id: 'forecast',
      label: '72-Hour Forecaster',
      description: 'Multi-variable trajectory & table',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: '72h',
      badgeStyle: 'bg-[#2A372E] text-[#B8C4BA] border border-[#3A4A3E]',
    },
    {
      id: 'physics',
      label: 'Diagnostics ("WHY")',
      description: 'Physics-guided root causes',
      icon: <HelpCircle className="w-4 h-4" />,
      badge: 'Physics',
      badgeStyle: 'bg-[#2A372E] text-[#B8C4BA] border border-[#3A4A3E]',
    },
    {
      id: 'compliance',
      label: 'GRAP & NAAQS',
      description: 'Statutory mandates & standards',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: `Stage ${grapStageNumber}`,
      badgeStyle: 'bg-[#2A372E] text-[#B8C4BA] border border-[#3A4A3E]',
    },
    {
      id: 'simulator',
      label: 'Policy Simulator',
      description: 'Interventional sandbox testing',
      icon: <Sliders className="w-4 h-4" />,
      badge: 'What-If',
      badgeStyle: 'bg-[#2A372E] text-[#B8C4BA] border border-[#3A4A3E]',
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1B241E] text-[#E5EAE6] flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Brand Header */}
          <div className="p-4 pb-5 flex items-center justify-between border-b border-[#2A362D]/70">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Cloud/Node Logo Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#27352B] border border-[#3B4C3E] flex items-center justify-center flex-shrink-0 shadow-inner">
                <div className="relative flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-[#B8C7BA]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] absolute -bottom-0.5 -right-0.5"></span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-extrabold text-[#F3EFE6] tracking-tight font-sans">
                    AIRNEXUS
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#2A372E] text-[#C9D4CC] border border-[#3E4F42]">
                    26082
                  </span>
                </div>
                <p className="text-[10px] text-[#8E9B90] font-medium tracking-tight mt-0.5 truncate">
                  MoEFCC • Decision Support System
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#8E9B90] hover:text-white md:hidden hover:bg-[#28362D] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="p-3.5 pt-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F7D72] px-2.5 block mb-2.5">
              NAVIGATION WORKSPACE
            </span>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activePage === item.id || (activePage === 'overview' && item.id === 'map3d');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-[#F3EFE6] text-[#1B241E] font-bold shadow-md'
                        : 'text-[#C5CEC7] hover:text-white hover:bg-[#253228]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition ${
                          isActive
                            ? 'text-[#1B241E]'
                            : 'text-[#8E9B90] group-hover:text-white'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-xs">{item.label}</span>
                        <span className={`text-[10px] block truncate font-normal ${
                          isActive ? 'text-[#556358]' : 'text-[#7B887E]'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex-shrink-0 ${
                          item.badgeStyle || 'bg-[#2A372E] text-[#B8C4BA]'
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

          {/* Official Gazette Bulletin Action Button */}
          <div className="px-3.5 pt-2">
            <button
              onClick={() => {
                onOpenGazette();
                onCloseMobile();
              }}
              className="w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#233027] hover:bg-[#2B3B30] text-[#D8E2DA] border border-[#344438] text-xs font-semibold shadow-xs transition"
            >
              <FileText className="w-4 h-4 text-[#A8B6AB]" />
              <span>Official Gazette Bulletin</span>
            </button>
          </div>

        </div>

        {/* Sidebar Footer with Live Telemetry & Skyline Illustration */}
        <div className="relative pt-3 pb-4 px-4 border-t border-[#2A362D]/70 bg-gradient-to-t from-[#161F19] to-[#1B241E] overflow-hidden">
          
          {/* Subtle Delhi Heritage Landmark Skyline SVG Silhouette */}
          <div className="absolute inset-x-0 bottom-0 opacity-15 pointer-events-none flex justify-center items-end h-16">
            <svg viewBox="0 0 300 60" className="w-full h-12 text-[#9FB5A3]" fill="currentColor">
              {/* India Gate */}
              <path d="M 120 60 L 120 25 L 125 25 L 125 20 L 138 20 L 138 25 L 143 25 L 143 60 L 137 60 L 137 35 Q 131.5 30 126 35 L 126 60 Z" />
              {/* Lotus Temple Petals */}
              <path d="M 40 60 Q 55 28 65 60 Q 75 32 85 60 Z" />
              {/* Qutub Minar Silhouette */}
              <polygon points="180,60 185,15 188,15 193,60" />
              {/* Red Fort Domes */}
              <path d="M 230 60 L 230 40 Q 240 30 250 40 L 250 60 Z M 215 60 L 215 45 Q 222 38 230 45 L 230 60 Z" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
              <div>
                <span className="text-xs font-semibold text-[#D2DBD4] block">WRF-Chem Sync</span>
                <span className="text-[10px] text-[#7A8A7F] font-mono">Synced • 21:04 IST</span>
              </div>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-[#344438] bg-[#243128] hover:bg-[#2C3C31] text-[#B8C6BB] hover:text-white transition shadow-xs"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
