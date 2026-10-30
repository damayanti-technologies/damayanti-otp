import React from 'react';
import { Shield, Smartphone, Server, Radio } from 'lucide-react';
import { HealthResponse } from '../types/auth';

interface HeaderProps {
  health: HealthResponse | null;
  isBackendHealthy: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, isBackendHealthy, onRefreshHealth }) => {
  const isGatewayOnline = health?.gateway?.isOnline ?? false;
  const deviceName = health?.gateway?.device?.name || 'Samsung Galaxy A35';
  const compliance = health?.complianceMode || 'DEVELOPMENT_MOCK';

  return (
    <header className="border-b border-[#1E293B]/80 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Shield className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#070B14] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-wider text-white">DAMAYANTI OTP</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                LIVE TESTBED
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium tracking-tight">
              Secure Authentication. Your Own Infrastructure.
            </p>
          </div>
        </div>

        {/* Live Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Backend Status */}
          <button
            onClick={onRefreshHealth}
            title="Click to refresh backend health probe"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              isBackendHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="font-semibold">Backend:</span>
            <span>{isBackendHealthy ? 'Online (Galaxy Book 4)' : 'Offline / Refused'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
          </button>

          {/* Android Gateway */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
              isGatewayOnline
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-semibold">Gateway:</span>
            <span>{isGatewayOnline ? `${deviceName} (BSNL)` : 'Waiting for Device'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isGatewayOnline ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Compliance Safeguard */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border bg-violet-500/10 border-violet-500/30 text-violet-300">
            <Radio className="w-3.5 h-3.5" />
            <span className="font-semibold">Mode:</span>
            <span className="mono font-bold text-[11px]">{compliance}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
