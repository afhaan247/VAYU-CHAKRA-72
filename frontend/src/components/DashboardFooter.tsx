import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

export const DashboardFooter: React.FC = () => {
  const [sysTime, setSysTime] = useState<string>('21:04:41 IST');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setSysTime(new Intl.DateTimeFormat('en-IN', options).format(now) + ' IST');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="pt-5 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#666D67] font-sans">
      
      {/* Left Mission Statement with Info Icon */}
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-full border border-[#C5BFB3] flex items-center justify-center flex-shrink-0 text-[#1C201C]">
          <Info className="w-3 h-3" />
        </div>
        <p className="font-normal text-[#4D554F]">
          <span className="font-bold text-[#1C201C]">AIRNEXUS</span> integrates physics, chemistry, and real-time observations to deliver actionable 72-hour air quality forecasts for Delhi NCR.
        </p>
      </div>

      {/* Right Data Sources & Live Time */}
      <div className="flex flex-col sm:items-end text-[10px] font-mono text-[#747E76] space-y-0.5">
        <div>
          <span>Data Sources: </span>
          <span className="font-medium text-[#4D554F]">CPCB • IMD • ISRO • CAAQMS • IITM • NASA FIRMS</span>
        </div>
        <div>
          <span>System Time: </span>
          <span className="font-semibold text-[#1C201C]">{sysTime}</span>
        </div>
      </div>

    </footer>
  );
};
