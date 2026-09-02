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
import { Delhi3DMap } from './components/Delhi3DMap';
import { LiveAirQualityCard } from './components/LiveAirQualityCard';
import { BottomMetricsRow } from './components/BottomMetricsRow';
import { DashboardFooter } from './components/DashboardFooter';
import { GrapAdvisoryPanel } from './components/GrapAdvisoryPanel';
import { NaaqsMatrix } from './components/NaaqsMatrix';
import { ForecastChart } from './components/ForecastChart';
import { WhyExplanation } from './components/WhyExplanation';
import { PhysicsGauges } from './components/PhysicsGauges';
import { SimulatorControl } from './components/SimulatorControl';
import { OfficialGazetteModal } from './components/OfficialGazetteModal';
import { AlertCircle, ArrowUpDown } from 'lucide-react';

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
  const [selectedHour, setSelectedHour] = useState<number>(1);
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

  const currentAqiAdjusted = current ? Math.round(current.aqi * selectedStation.multiplier) : 311;
  const peak72hAqi = forecastData ? forecastData.overall_72h_max_aqi : 354;

  const getGrapStageNumber = (aqi: number) => {
    if (aqi > 450) return 4;
    if (aqi > 400) return 3;
    if (aqi > 300) return 2;
    if (aqi > 200) return 1;
    return 0;
  };
  const activeGrapStage = getGrapStageNumber(Math.max(currentAqiAdjusted, Math.round(peak72hAqi * selectedStation.multiplier)));

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#111813] text-[#E5EAE6]' : 'bg-[#EFECE6] text-[#1C201C]'} flex font-sans transition-colors duration-200`}>
      
      {/* Visual Splash Screen on Initial Launch */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Fixed Left Sidebar Navigation */}
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

      {/* Main App Content Wrapper */}
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
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-3 w-full">
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-700" />
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
          } bg-[#FCFAF7] border-[#2E7D47]/40 text-[#1C201C]`}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <ArrowUpDown className="w-3.5 h-3.5 text-[#2E7D47]" />
          <span>Live telemetry sync active — {lastUpdated}</span>
        </div>

        {/* Main Content Workspace */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-6 w-full flex-1 flex flex-col justify-between">

          {/* ══════════════════════════════════════════════════════════
              PAGE 1: OVERVIEW & LIVE FEED (EXACT MATCH TO SCREENSHOT)
              ══════════════════════════════════════════════════════════ */}
          {(activePage === 'overview' || activePage === 'map3d') && (
            <div className="space-y-4 animate-fadeIn flex-1 flex flex-col justify-between">
              
              {/* Top Row: 3D Delhi NCR Map (left ~67%) + Live Air Quality Card (right ~33%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                
                {/* 3D Air Quality Map Card */}
                <div className="lg:col-span-8 flex">
                  <Delhi3DMap
                    forecastData={forecastData}
                    selectedHour={selectedHour}
                    onSelectHour={setSelectedHour}
                    className="w-full"
                  />
                </div>

                {/* Live Air Quality Card */}
                <div className="lg:col-span-4 flex">
                  <LiveAirQualityCard
                    current={current}
                    selectedStation={selectedStation}
                    className="w-full"
                  />
                </div>

              </div>

              {/* Bottom Row: 5 Metric Cards */}
              <BottomMetricsRow
                onNavigate={setActivePage}
                peakAqi={peak72hAqi}
                grapStage={activeGrapStage}
                ventilationRate={Math.round(current ? current.wind_speed * current.pbl_height : 394)}
              />

              {/* Footer Banner */}
              <DashboardFooter />

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

              <DashboardFooter />
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

              <DashboardFooter />
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

              <DashboardFooter />
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

              <DashboardFooter />
            </div>
          )}

        </main>

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
