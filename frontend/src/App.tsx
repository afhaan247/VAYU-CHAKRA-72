import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  CurrentStatus, 
  ForecastResponse, 
  ForecastHourItem, 
  SimulationResponse, 
  MonitoringStation 
} from './types';
import { fetchCurrentStatus, fetch72HourForecast } from './api';
import { DELHI_NCR_STATIONS } from './data/stations';
import { Sidebar, AppPage } from './components/Sidebar';
import { Header } from './components/Header';
import { SplashScreen } from './components/SplashScreen';
import { CurrentAQICard } from './components/CurrentAQICard';
import { GrapAdvisoryPanel } from './components/GrapAdvisoryPanel';
import { NaaqsMatrix } from './components/NaaqsMatrix';
import { ForecastChart } from './components/ForecastChart';
import { WhyExplanation } from './components/WhyExplanation';
import { PhysicsGauges } from './components/PhysicsGauges';
import { SimulatorControl } from './components/SimulatorControl';
import { OfficialGazetteModal } from './components/OfficialGazetteModal';
import { 
  AlertCircle, 
  ArrowUpDown, 
  TrendingUp, 
  ShieldAlert, 
  Wind, 
  Sliders, 
  ArrowRight
} from 'lucide-react';

const POLL_INTERVAL_MS = 60_000;

function currentStatusChanged(a: CurrentStatus, b: CurrentStatus): boolean {
  return (
    a.aqi !== b.aqi ||
    a.timestamp !== b.timestamp ||
    a.category !== b.category ||
    Math.abs(a.pm25 - b.pm25) > 0.5 ||
    Math.abs(a.wind_speed - b.wind_speed) > 0.1
  );
}

function forecastChanged(a: ForecastResponse, b: ForecastResponse): boolean {
  if (a.generated_at !== b.generated_at) return true;
  if (a.overall_72h_avg_aqi !== b.overall_72h_avg_aqi) return true;
  if (a.forecast.length !== b.forecast.length) return true;
  const spots = [0, 11, 23, 47, 71];
  return spots.some(
    (i) => a.forecast[i] && b.forecast[i] && a.forecast[i].aqi !== b.forecast[i].aqi
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<AppPage>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [current, setCurrent] = useState<CurrentStatus | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation>(DELHI_NCR_STATIONS[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isGazetteOpen, setIsGazetteOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [dataChangedToast, setDataChangedToast] = useState<boolean>(false);
  const toastTimerRef = useRef<number | null>(null);

  const currentRef = useRef<CurrentStatus | null>(null);
  const forecastRef = useRef<ForecastResponse | null>(null);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { forecastRef.current = forecastData; }, [forecastData]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [curRes, fcRes] = await Promise.all([
        fetchCurrentStatus(),
        fetch72HourForecast()
      ]);
      setCurrent(curRes);
      setForecastData(fcRes);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    } catch (err: any) {
      console.error(err);
      setError('Backend service connecting... Ensure backend FastAPI server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const silentPoll = useCallback(async () => {
    try {
      const [curRes, fcRes] = await Promise.all([
        fetchCurrentStatus(),
        fetch72HourForecast()
      ]);

      const curChanged = !currentRef.current || currentStatusChanged(currentRef.current, curRes);
      const fcChanged = !forecastRef.current || forecastChanged(forecastRef.current, fcRes);

      if (curChanged || fcChanged) {
        if (curChanged) setCurrent(curRes);
        if (fcChanged) setForecastData(fcRes);
        setLastUpdated(new Date().toLocaleTimeString('en-IN'));

        setDataChangedToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setDataChangedToast(false), 4000);
      }
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const id = window.setInterval(silentPoll, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [silentPoll]);

  const handleSimulationResult = (simResult: SimulationResponse) => {
    if (forecastData) {
      setForecastData({
        ...forecastData,
        overall_72h_avg_aqi: simResult.simulated_72h_avg_aqi,
        forecast: simResult.forecast
      });
    }
  };

  const selectedHourItem: ForecastHourItem | null = forecastData && forecastData.forecast 
    ? forecastData.forecast.find(f => f.hour === selectedHour) || forecastData.forecast[0]
    : null;

  const currentAqiAdjusted = current ? Math.round(current.aqi * selectedStation.multiplier) : 0;
  const peak72hAqi = forecastData ? forecastData.overall_72h_max_aqi : 0;

  const getGrapStageNumber = (aqi: number) => {
    if (aqi > 450) return 4;
    if (aqi > 400) return 3;
    if (aqi > 300) return 2;
    if (aqi > 200) return 1;
    return 0;
  };
  const activeGrapStage = getGrapStageNumber(Math.max(currentAqiAdjusted, Math.round(peak72hAqi * selectedStation.multiplier)));

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#070E1B] text-slate-100' : 'bg-slate-100/70 text-slate-900'} flex font-sans transition-colors duration-200`}>
      
      {/* ── Visual Splash Screen on Initial Launch ────────────────── */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* ── Fixed Left Sidebar Navigation ──────────────────────────── */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        selectedStation={selectedStation}
        grapStageNumber={activeGrapStage}
        onOpenGazette={() => setIsGazetteOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        lastUpdated={lastUpdated}
      />

      {/* ── Main App Content Wrapper (Offset for fixed sidebar) ──────── */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-72 transition-all duration-300">
        
        {/* Top Header Toolbar */}
        <Header
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
          onRefresh={loadData}
          isLoading={isLoading}
          onOpenGazette={() => setIsGazetteOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          lastUpdated={lastUpdated}
          activePage={activePage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Error Alert Banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-3 w-full">
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3 rounded-lg flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Live Data Changed Toast */}
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-mono font-bold transition-all duration-500 ${
            dataChangedToast
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          } bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300`}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live data updated — {lastUpdated}</span>
        </div>

        {/* Main Content Workspace */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 w-full flex-1">

          {/* ══════════════════════════════════════════════════════════
              PAGE 1: OVERVIEW & LIVE FEED
              ══════════════════════════════════════════════════════════ */}
          {activePage === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Live CAAQMS Sensor Feed Card */}
              <CurrentAQICard 
                current={current} 
                station={selectedStation}
                peak72hAqi={peak72hAqi}
              />

              {/* 4 Executive Action KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Card 1: Peak Forecast Callout */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-gov flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                      <span>72H PEAK FORECAST</span>
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono text-red-700 dark:text-red-400">
                        {Math.round(peak72hAqi * selectedStation.multiplier)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        AQI (Severe)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      Peak episode projected around Hour +{forecastData?.forecast.reduce((m, f) => f.aqi > m.aqi ? f : m, forecastData?.forecast[0] || {} as any)?.hour || 12}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('forecast')}
                    className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-blue-700 dark:text-sky-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <span>View 72h Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 2: CAQM GRAP Mandate */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-gov flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                      <span>CAQM GRAP STATUS</span>
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                        STAGE {activeGrapStage || 1}
                      </span>
                      <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      BS-III/IV LMV restrictions and mechanized sweeping mandated across NCR.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('compliance')}
                    className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-blue-700 dark:text-sky-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <span>View GRAP Directives</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 3: Boundary Physics State */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-gov flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                      <span>VENTILATION RATE (Vc)</span>
                      <Wind className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black font-mono text-blue-700 dark:text-sky-400">
                        {Math.round(current ? current.wind_speed * current.pbl_height : 0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        m²/s
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {current && current.wind_speed * current.pbl_height < 1500 ? 'Severe atmospheric stagnation cap.' : 'Moderate dispersion window.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('physics')}
                    className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-blue-700 dark:text-sky-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <span>Inspect "WHY" Engine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card 4: What-If Simulator Sandbox */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-gov flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                      <span>POLICY SIMULATOR</span>
                      <Sliders className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                        5 SCENARIOS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      Test stubble burning wave, rain washout, and vehicle bans.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('simulator')}
                    className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-blue-700 dark:text-sky-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <span>Launch Policy Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* 2-Column Snapshot: Trajectory + Cause Synopsis */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  {forecastData && (
                    <ForecastChart
                      forecast={forecastData.forecast}
                      selectedHour={selectedHour}
                      onSelectHour={setSelectedHour}
                      stationMultiplier={selectedStation.multiplier}
                    />
                  )}
                </div>
                <div className="lg:col-span-4">
                  <WhyExplanation
                    selectedHour={selectedHour}
                    forecastItem={selectedHourItem}
                    stationMultiplier={selectedStation.multiplier}
                  />
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PAGE 2: 72-HOUR FORECASTER
              ══════════════════════════════════════════════════════════ */}
          {activePage === 'forecast' && (
            <div className="space-y-4 animate-fadeIn">
              {forecastData && (
                <ForecastChart
                  forecast={forecastData.forecast}
                  selectedHour={selectedHour}
                  onSelectHour={setSelectedHour}
                  stationMultiplier={selectedStation.multiplier}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7">
                  <PhysicsGauges forecastHour={selectedHourItem} />
                </div>
                <div className="lg:col-span-5">
                  <WhyExplanation
                    selectedHour={selectedHour}
                    forecastItem={selectedHourItem}
                    stationMultiplier={selectedStation.multiplier}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PAGE 3: SCIENTIFIC DIAGNOSTICS ("WHY" ENGINE)
              ══════════════════════════════════════════════════════════ */}
          {activePage === 'physics' && (
            <div className="space-y-4 animate-fadeIn">
              <PhysicsGauges forecastHour={selectedHourItem} />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <WhyExplanation
                    selectedHour={selectedHour}
                    forecastItem={selectedHourItem}
                    stationMultiplier={selectedStation.multiplier}
                  />
                </div>
                <div className="lg:col-span-6">
                  {forecastData && (
                    <ForecastChart
                      forecast={forecastData.forecast}
                      selectedHour={selectedHour}
                      onSelectHour={setSelectedHour}
                      stationMultiplier={selectedStation.multiplier}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PAGE 4: GRAP & NAAQS COMPLIANCE
              ══════════════════════════════════════════════════════════ */}
          {activePage === 'compliance' && (
            <div className="space-y-4 animate-fadeIn">
              <GrapAdvisoryPanel
                currentAqi={currentAqiAdjusted}
                peak72hAqi={peak72hAqi}
              />
              <NaaqsMatrix
                current={current}
                forecast={forecastData ? forecastData.forecast : []}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PAGE 5: "WHAT-IF" POLICY SIMULATOR
              ══════════════════════════════════════════════════════════ */}
          {activePage === 'simulator' && (
            <div className="space-y-4 animate-fadeIn">
              <SimulatorControl
                onSimulationResult={handleSimulationResult}
                onReset={loadData}
              />

              {forecastData && (
                <ForecastChart
                  forecast={forecastData.forecast}
                  selectedHour={selectedHour}
                  onSelectHour={setSelectedHour}
                  stationMultiplier={selectedStation.multiplier}
                />
              )}
            </div>
          )}

        </main>

        {/* Official Government Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1528] py-4 text-xs text-slate-600 dark:text-slate-400 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#0F2A4A] dark:text-sky-300">VAYU-CHAKRA 72</span>
              <span>•</span>
              <span>SIH Problem Statement 26082</span>
              <span>•</span>
              <span>MoEFCC / CPCB Decision Support System</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-center sm:text-right flex items-center space-x-2">
              <span className="flex h-1.5 w-1.5 relative inline-block">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Auto-sync active • Polls every 60s for live changes</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Official Gazette Printable Modal */}
      <OfficialGazetteModal
        isOpen={isGazetteOpen}
        onClose={() => setIsGazetteOpen(false)}
        current={current}
        forecastData={forecastData}
        station={selectedStation}
      />

    </div>
  );
}
