import React, { useState, useEffect } from 'react';
import { Smartphone, Battery, Clock, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DeviceRecord } from '../types';

export const DevicesView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();
      setDevices(data);
    } catch (e) {
      console.error('Failed to load devices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDisable = async (deviceId: string) => {
    if (!window.confirm(`Are you sure you want to disable gateway device ${deviceId}?`)) return;
    try {
      setActionInProgress(deviceId);
      await api.disableDevice(deviceId);
      await fetchDevices();
    } catch (e) {
      alert('Failed to disable device');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-violet-400" />
            Registered Android Devices
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Hardware gateways authorized to receive SMS dispatch jobs from this laptop server.
          </p>
        </div>

        <button
          onClick={fetchDevices}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#161D31] hover:bg-[#1E2742] text-xs font-semibold text-gray-300 border border-[#2B354F] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#12182B] text-gray-400 font-semibold border-b border-[#1F2937] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Device</th>
                <th className="py-3.5 px-4">Hardware ID</th>
                <th className="py-3.5 px-4">SIM Carrier</th>
                <th className="py-3.5 px-4">Battery</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Heartbeat</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-300">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No devices registered yet. Open the Damayanti SMS Gateway Android app to pair your phone.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isOnline = device.status === 'ONLINE';
                  const isDisabled = device.status === 'DISABLED';
                  return (
                    <tr key={device.id} className="hover:bg-[#141B30] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {device.name}
                        {device.model && <span className="block text-[11px] text-gray-500 font-normal">{device.model}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">{device.deviceId}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">{device.simCarrier || 'BSNL'}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Battery className="w-3.5 h-3.5 text-gray-400" />
                          <span>{device.batteryLevel !== null && device.batteryLevel !== undefined ? `${device.batteryLevel}%` : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isOnline
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isDisabled
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString('en-IN') : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isDisabled && (
                          <button
                            onClick={() => handleDisable(device.deviceId)}
                            disabled={actionInProgress === device.deviceId}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Disable</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
