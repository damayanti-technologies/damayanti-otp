import React from 'react';
import { Radio, Signal, Battery, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DashboardData } from '../types';

interface GatewayViewProps {
  data: DashboardData | null;
}

export const GatewayView: React.FC<GatewayViewProps> = ({ data }) => {
  const isOnline = data?.gateway.isOnline || false;
  const devices = data?.gateway.devices || [];
  const primaryDevice = devices[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400" />
          SMS Gateway Telemetry &amp; Radio Controls
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Hardware status and carrier telemetry for our Samsung Galaxy A35 Android SMS transmitter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Specs Card */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            Transmitter Hardware
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Device Model:</span>
              <span className="text-white font-semibold">Samsung Galaxy A35 (SM-A356E)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Operating System:</span>
              <span className="text-white">Android 14 (One UI 6+)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Hardware ID:</span>
              <span className="font-mono text-gray-300">{primaryDevice?.deviceId || 'samsung_galaxy_a35'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Execution Mode:</span>
              <span className="text-emerald-400 font-medium">Foreground Service + Wakelock</span>
            </div>
          </div>
        </div>

        {/* Carrier & Cellular Radio */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Signal className="w-4 h-4 text-emerald-400" />
            Cellular Carrier &amp; SIM
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Primary SIM Carrier:</span>
              <span className="text-emerald-400 font-bold">Bharat Sanchar Nigam Limited (BSNL)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Selected Slot:</span>
              <span className="text-white">SIM Slot 1 (SubscriptionManager Active)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Radio Dispatch Method:</span>
              <span className="text-white font-mono">android.telephony.SmsManager</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Delivery Confirmation:</span>
              <span className="text-blue-400 font-mono">SentIntent Activity.RESULT_OK</span>
            </div>
          </div>
        </div>

        {/* Network & Power Status */}
        <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Battery className="w-4 h-4 text-amber-400" />
            Connection &amp; Battery
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Battery Level:</span>
              <span className="text-white font-bold">{primaryDevice?.batteryLevel ?? 92}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Heartbeat Interval:</span>
              <span className="text-white">Every 30 seconds</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Job Polling Rate:</span>
              <span className="text-white">Every 3 seconds (Long-Poll)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Transport Security:</span>
              <span className="text-violet-400 font-mono font-medium">HMAC-SHA256 Signed + Nonce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
