import React from 'react';
import {
  KeyRound,
  ListOrdered,
  CheckCircle2,
  XCircle,
  Smartphone,
  Send,
  Radio,
  Battery,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DashboardData } from '../types';

interface OverviewViewProps {
  data: DashboardData | null;
  onNavigate: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ data, onNavigate }) => {
  const metrics = data?.metrics || {
    totalOtpRequests: 0,
    queuedJobs: 0,
    messagesSubmitted: 0,
    failedMessages: 0,
    activeDevices: 0,
    messagesSentToday: 0,
  };

  const devices = data?.gateway.devices || [];

  return (
    <div className="space-y-6">
      {/* 6 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total OTP Requests"
          value={metrics.totalOtpRequests}
          subtitle="All-time verified"
          icon={KeyRound}
          variant="blue"
        />
        <StatCard
          title="SMS Jobs Queued"
          value={metrics.queuedJobs}
          subtitle="Awaiting device pickup"
          icon={ListOrdered}
          variant="amber"
        />
        <StatCard
          title="Messages Submitted"
          value={metrics.messagesSubmitted}
          subtitle="Accepted by BSNL SIM"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Failed Messages"
          value={metrics.failedMessages}
          subtitle="Carrier / Radio errors"
          icon={XCircle}
          variant="rose"
        />
        <StatCard
          title="Active Devices"
          value={metrics.activeDevices}
          subtitle="Transmitting gateways"
          icon={Smartphone}
          variant="violet"
        />
        <StatCard
          title="Messages Sent Today"
          value={metrics.messagesSentToday}
          subtitle="Since 00:00 local time"
          icon={Send}
          variant="emerald"
        />
      </div>

      {/* Two Column Layout: Gateway Health & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Gateway Status Card */}
        <div className="lg:col-span-2 bg-[#0E1322] border border-[#1F2937] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2937]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Samsung Galaxy A35 SMS Gateway</h3>
                <p className="text-xs text-gray-400">Physical BSNL SIM transmitter</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('devices')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              Manage Devices
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="py-10 text-center">
              <Smartphone className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">No Gateway Device Connected</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Open the Damayanti SMS Gateway app on your Samsung Galaxy A35 and pair it with this laptop server.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-[#12182B] border border-[#1F2937] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{dev.name}</h4>
                      <p className="text-xs text-gray-400">ID: {dev.deviceId} • Carrier: BSNL</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-gray-300">
                    <div className="flex items-center space-x-1.5">
                      <Battery className="w-4 h-4 text-emerald-400" />
                      <span>{dev.batteryLevel !== null ? `${dev.batteryLevel}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Heartbeat: {new Date(dev.lastHeartbeat).toLocaleTimeString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Cryptographic Architecture Status */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Security</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Zero-Plaintext OTP Architecture</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Every OTP generated is hashed using Argon2id with 64 MB memory-hardness. Plaintext codes are discarded
              immediately after dispatch to prevent database enumeration.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1F2937]">
                <span className="text-gray-400">OTP Algorithm:</span>
                <span className="font-mono text-emerald-400 font-semibold">Argon2id ($v=19$ m=65536)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1F2937]">
                <span className="text-gray-400">OTP Expiration:</span>
                <span className="text-white font-medium">300 Seconds (5 Mins)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#1F2937]">
                <span className="text-gray-400">Resend Cooldown:</span>
                <span className="text-white font-medium">60 Seconds</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-gray-400">Max Attempts:</span>
                <span className="text-white font-medium">5 Attempts Per Code</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('security')}
            className="w-full mt-6 py-2.5 px-4 rounded-lg bg-[#161D31] hover:bg-[#1E2742] border border-[#2B354F] text-xs font-semibold text-white transition-colors"
          >
            View Security Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
