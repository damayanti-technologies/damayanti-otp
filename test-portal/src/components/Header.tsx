import React, { useState } from 'react';
import { Shield, Smartphone, Server, Radio, Settings2, KeyRound, ExternalLink, X, Check } from 'lucide-react';
import { HealthResponse } from '../types/auth';

interface HeaderProps {
  health: HealthResponse | null;
  isBackendHealthy: boolean;
  onRefreshHealth: () => void;
  activeTab: 'portal' | 'dashboard' | 'android';
  onSelectTab: (tab: 'portal' | 'dashboard' | 'android') => void;
  serverUrl: string;
  onUpdateServerUrl: (url: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  isBackendHealthy,
  onRefreshHealth,
  activeTab,
  onSelectTab,
  serverUrl,
  onUpdateServerUrl,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);
  const isGatewayOnline = health?.gateway?.isOnline ?? false;
  const deviceName = health?.gateway?.device?.name || 'Samsung Galaxy A35';
  const compliance = health?.complianceMode || 'DEVELOPMENT_MOCK';

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServerUrl(tempUrl);
    setIsConfigOpen(false);
    onRefreshHealth();
  };

  return (
    <>
      <header className="border-b border-[#1E293B]/80 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Tagline */}
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
                  GITHUB LIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-tight">
                Secure Authentication. Your Own Infrastructure.
              </p>
            </div>
          </div>

          {/* Navigation Switcher Tabs */}
          <nav className="flex items-center p-1 bg-[#0D1424] border border-[#1E293B] rounded-xl text-xs font-semibold">
            <button
              onClick={() => onSelectTab('portal')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'portal'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>OTP Auth Portal</span>
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('android')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'android'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Gateway</span>
            </button>
          </nav>

          {/* Live Status Badges & Settings */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Backend Indicator */}
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Click to configure backend connection"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                isBackendHealthy
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isBackendHealthy ? 'Live Local' : 'Cloud Preview'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                }`}
              />
              <Settings2 className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {/* Android Gateway */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${
                isGatewayOnline
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isGatewayOnline ? 'A35 (BSNL)' : 'Gateway Ready'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isGatewayOnline ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Backend Settings Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0D1424] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Backend Connection Settings</h3>
                <p className="text-xs text-gray-400">Damayanti Laptop Server / Cloud Tunnel</p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Server Endpoint URL
                </label>
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:4000 or https://xyz.ngrok.io"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Default is <code className="text-blue-300">http://localhost:4000</code>. On GitHub Pages, if no local server or tunnel is running, the portal automatically operates in full interactive simulation mode.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTempUrl('http://localhost:4000');
                    onUpdateServerUrl('http://localhost:4000');
                    setIsConfigOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
