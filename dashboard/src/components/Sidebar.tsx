import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Radio,
  Smartphone,
  KeyRound,
  History,
  ShieldCheck,
  Lock,
  Settings,
} from 'lucide-react';
import { TabId } from '../types';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Layers },
    { id: 'gateway', label: 'SMS Gateway', icon: Radio },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'otp-requests', label: 'OTP Requests', icon: KeyRound },
    { id: 'messages', label: 'Message History', icon: History },
    { id: 'credentials', label: 'API Credentials', icon: Lock },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-[#0E1322] border-r border-[#1F2937] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1F2937] flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            DAMAYANTI <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-semibold border border-violet-500/30">OTP</span>
          </h1>
          <p className="text-xs text-gray-400 font-medium">Self-Hosted Auth Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/10 text-white border-l-4 border-blue-500 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#161D31]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Hardware Footer */}
      <div className="p-4 border-t border-[#1F2937] bg-[#0A0E1A]">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-medium text-gray-300">Host: Galaxy Book 4</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">Windows 11 Server • Port 4000</p>
      </div>
    </aside>
  );
};
