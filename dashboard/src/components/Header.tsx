import React from 'react';
import { RefreshCw, Radio, Server } from 'lucide-react';

interface HeaderProps {
  isOnline: boolean;
  activeDeviceCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  activeDeviceCount,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="h-16 bg-[#0E1322]/80 backdrop-blur-md border-b border-[#1F2937] flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#161D31] text-gray-300 border border-[#2B354F]">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>Local Server: Laptop (0.0.0.0:4000)</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Gateway Status Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <Radio className="w-3.5 h-3.5" />
          <span>
            {isOnline
              ? `GATEWAY ACTIVE (${activeDeviceCount} ${activeDeviceCount === 1 ? 'Device' : 'Devices'})`
              : 'GATEWAY IDLE / OFFLINE'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-white bg-[#161D31] hover:bg-[#1E2742] border border-[#2B354F] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          title="Refresh statistics"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
