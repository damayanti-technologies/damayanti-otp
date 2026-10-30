import React, { useState } from 'react';
import { RefreshCw, Radio, Server, Settings, Check } from 'lucide-react';
import { getServerUrl, setServerUrl, isConnectedToLiveServer } from '../services/api';

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
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl() || 'http://localhost:4000');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setServerUrl(serverUrlInput);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowConfig(false);
      onRefresh();
    }, 1000);
  };

  return (
    <header className="h-16 bg-[#0E1322]/90 backdrop-blur-md border-b border-[#1F2937] flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#161D31] hover:bg-[#1E2742] text-gray-300 border border-[#2B354F] transition-colors"
          title="Click to configure backend laptop server URL"
        >
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>Server: {getServerUrl() || 'Localhost:4000'}</span>
          <Settings className="w-3 h-3 text-gray-500 ml-1" />
        </button>

        {isConnectedToLiveServer ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            LIVE BACKEND
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            GITHUB PAGES PREVIEW
          </span>
        )}
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
              ? `BSNL GATEWAY ACTIVE (${activeDeviceCount} ${activeDeviceCount === 1 ? 'Device' : 'Devices'})`
              : 'GATEWAY IDLE'}
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

      {/* Server URL Config Modal */}
      {showConfig && (
        <div className="absolute top-16 left-6 w-96 bg-[#0E1322] border border-[#2B354F] rounded-xl shadow-2xl p-4 z-50 text-xs">
          <h4 className="font-bold text-white text-sm mb-1">Backend Server Connection</h4>
          <p className="text-gray-400 mb-3 text-[11px]">
            Configure the URL of your Windows 11 laptop running Damayanti OTP.
          </p>

          <input
            type="text"
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder="http://localhost:4000 or tunnel URL"
            className="w-full bg-[#161D31] border border-[#2B354F] rounded-lg px-3 py-2 text-white font-mono text-xs mb-3 outline-none focus:border-blue-500"
          />

          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1"
            >
              {saved && <Check className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved!' : 'Save & Reconnect'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
