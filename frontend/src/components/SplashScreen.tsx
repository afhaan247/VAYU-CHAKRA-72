import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Cpu, Wind, CheckCircle2, ChevronRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const bootSteps = [
    { title: 'Connecting to CAAQMS Continuous Ambient Feeds', detail: '9 Stations • Delhi-NCR Grid' },
    { title: 'Fetching Planetary Boundary Layer (PBL) & Wind Vectors', detail: 'WRF-Chem Assimilation' },
    { title: 'Calibrating Seq2Seq LSTM Physics Dispersion Engine', detail: '72-Hour Horizon Matrix' },
    { title: 'Loading CAQM GRAP Statutory Mitigation Matrix', detail: 'Commission for Air Quality Management' },
    { title: 'Portal Ready — Initializing Executive Decision Dashboard', detail: 'MoEFCC National Grid' },
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(stepInterval);
          return 100;
        }
        const next = prev + 2;
        // Advance steps based on progress
        const stepIdx = Math.min(Math.floor((next / 100) * bootSteps.length), bootSteps.length - 1);
        setCurrentStep(stepIdx);
        return next;
      });
    }, 35);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onComplete, 450); // wait for fade transition
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070E1B] text-slate-100 font-sans transition-opacity duration-500 overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Animated Gradient Mesh & Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(15,42,74,0.8)_0%,rgba(7,14,27,0.95)_70%,rgba(3,7,18,1)_100%)] pointer-events-none"></div>

      {/* Subtle Grid Lines Background */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#38BDF8 1px, transparent 1px), linear-gradient(90deg, #38BDF8 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Sovereign Tricolor Accent Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shadow-[0_0_15px_rgba(255,153,51,0.5)]"></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Radar / Chakra Atmospheric Ring Visual */}
        <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-30"></div>
          
          {/* Outer Rotating Concentric Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-sky-400/40 animate-[spin_12s_linear_infinite]"></div>
          
          {/* Middle Counter-rotating Ring with Quadrant markers */}
          <div className="absolute inset-2 rounded-full border border-blue-400/30 animate-[spin_8s_linear_infinite_reverse]"></div>

          {/* Central Ashoka Chakra / Radar Core */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#0F2A4A] to-[#163b65] border-2 border-sky-400/60 shadow-[0_0_25px_rgba(56,189,248,0.4)] flex flex-col items-center justify-center">
            <span className="text-xl leading-none">🇮🇳</span>
            <span className="text-[9px] font-mono font-bold tracking-widest text-amber-300 mt-1 uppercase">
              CPCB
            </span>
          </div>

          {/* Radar Sweep Needle */}
          <div 
            className="absolute inset-0 rounded-full origin-center animate-[spin_3s_linear_infinite] pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.4) 0deg, rgba(56, 189, 248, 0) 60deg, transparent 360deg)'
            }}
          ></div>
        </div>

        {/* Official Portal Titles */}
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-sky-300 text-xs font-mono mb-2 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SIH 2024–2026 • PS ID: 26082</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            VAYU-CHAKRA 72
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-sky-200/90 font-serif">
            पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय
          </p>
          <p className="text-xs text-slate-300 font-medium">
            Ministry of Environment, Forest & Climate Change • Govt. of India
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Commission for Air Quality Management (CAQM NCR)
          </p>
        </div>

        {/* Progress Bar & Status Metric */}
        <div className="w-full bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 backdrop-blur-md shadow-2xl space-y-3">
          
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>System Initialization</span>
            </span>
            <span className="text-sky-300 font-bold">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Boot Steps Diagnostic Log */}
          <div className="pt-2 border-t border-slate-700/60 text-left">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {bootSteps[currentStep].title}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {bootSteps[currentStep].detail}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Launch Skip Button */}
        <div className="mt-6 flex items-center justify-between w-full text-xs font-mono text-slate-500">
          <span className="text-[11px]">Physics-Guided Seq2Seq LSTM Engine</span>
          <button
            onClick={handleSkip}
            className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-0.5 py-1 px-2 rounded hover:bg-slate-800/40 transition"
          >
            <span>Skip Intro</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Sovereign Bottom Stripe */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] opacity-60"></div>
    </div>
  );
};
