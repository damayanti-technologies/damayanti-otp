import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Clock,
  Radio,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { HealthResponse, SmsJobStatusResponse, ApiTrace } from '../types/auth';

interface DevDashboardProps {
  health: HealthResponse | null;
  smsJobStatus: SmsJobStatusResponse | null;
  traces: ApiTrace[];
  correlationId: string | null;
  onRefreshAll: () => void;
  isLoadingHealth: boolean;
}

export const DevDashboard: React.FC<DevDashboardProps> = ({
  health,
  smsJobStatus,
  traces,
  correlationId,
  onRefreshAll,
  isLoadingHealth,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'status' | 'sms' | 'inspector' | 'safeguards'>('status');

  const isBackendHealthy = health?.status === 'healthy';
  const isGatewayOnline = health?.gateway?.isOnline ?? false;
  const device = health?.gateway?.device;
  const queue = health?.queue;
  const job = smsJobStatus?.job;

  const getJobStatusBadge = (status?: string) => {
    switch (status) {
      case 'QUEUED':
        return <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">QUEUED</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">ASSIGNED TO GALAXY A35</span>;
      case 'SENDING':
        return <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">SENDING VIA SIM...</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">SUBMITTED TO TOWER (ACK)</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">FAILED</span>;
      default:
        return <span className="text-gray-500 text-[10px]">No active job</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 mb-8 border border-[#1E293B] rounded-2xl bg-[#090E1B] overflow-hidden shadow-2xl">
      {/* Top Banner Bar */}
      <div className="px-4 py-3 bg-[#0D1527] border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Live Diagnostics &amp; Gateway Telemetry</span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
            (Responses verified directly from Backend API)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefreshAll}
            disabled={isLoadingHealth}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
            title="Refresh Diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-[#1E293B] bg-[#0A101F] text-xs font-semibold px-4 space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Infrastructure Status</span>
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`py-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'sms'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live SMS Queue Tracker</span>
              {job && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`py-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'inspector'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>API Inspector ({traces.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('safeguards')}
              className={`py-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'safeguards'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Testing Safeguards</span>
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {/* TAB 1: Status Cards */}
            {activeTab === 'status' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Backend */}
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold">Authoritative Server</span>
                    {isBackendHealthy ? (
                      <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>HEALTHY</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-rose-400 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>OFFLINE</span>
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-white">
                    Galaxy Book 4 (Win 11)
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-0.5 font-mono">
                    <div>DB Latency: <span className="text-white">{health?.database?.latencyMs ?? 0} ms</span></div>
                    <div>Uptime: <span className="text-white">{health?.uptimeSeconds ?? 0}s</span></div>
                  </div>
                </div>

                {/* 2. Android Gateway */}
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold">SMS Transmitter</span>
                    {isGatewayOnline ? (
                      <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>ONLINE</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>WAITING</span>
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-white truncate" title={device?.name || 'Samsung Galaxy A35'}>
                    {device?.name || 'Samsung Galaxy A35'}
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-0.5 font-mono">
                    <div>Carrier: <span className="text-blue-400">{device?.simCarrier || 'BSNL Mobile'}</span></div>
                    <div>Last Heartbeat: <span className="text-white">{device?.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleTimeString() : 'Awaiting APK'}</span></div>
                  </div>
                </div>

                {/* 3. SMS Queue */}
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold">SMS Queue Status</span>
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-base font-extrabold text-white flex items-baseline space-x-2">
                    <span>{queue?.submitted ?? 0}</span>
                    <span className="text-xs font-normal text-emerald-400">Submitted</span>
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-0.5 font-mono">
                    <div>Pending in Queue: <span className="text-amber-400">{queue?.queued ?? 0}</span></div>
                    <div>Failed Dispatches: <span className="text-rose-400">{queue?.failed ?? 0}</span></div>
                  </div>
                </div>

                {/* 4. Active OTP Flow */}
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold">Active OTP Request</span>
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate" title={correlationId || 'No active request'}>
                    {correlationId ? correlationId.slice(0, 18) + '...' : 'Idle'}
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-0.5">
                    <div>Delivery Status: {getJobStatusBadge(job?.status)}</div>
                    <div>Retry Attempts: <span className="font-mono text-white">{job?.retryCount ?? 0}/3</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Live SMS Queue Tracker */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                {job ? (
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1A243B]">
                      <div>
                        <span className="text-xs text-gray-400 block">Job Identifier</span>
                        <span className="font-mono text-sm font-bold text-white">{job.id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Current Radio State:</span>
                        {getJobStatusBadge(job.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Recipient Number</span>
                        <span className="text-white font-bold">{job.recipientNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Assigned Time</span>
                        <span className="text-gray-300">{job.assignedAt ? new Date(job.assignedAt).toLocaleTimeString() : 'Pending Device'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Carrier Radio ACK</span>
                        <span className="text-emerald-400 font-bold">{job.submittedAt ? new Date(job.submittedAt).toLocaleTimeString() : 'Awaiting Tower ACK'}</span>
                      </div>
                    </div>

                    {job.failureReason && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        <strong>Failure Reason:</strong> {job.failureReason}
                      </div>
                    )}

                    {/* Radio Logs */}
                    {job.logs && job.logs.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-gray-400 block mb-1">Radio Tower Event Log:</span>
                        <div className="space-y-1 font-mono text-[11px] bg-[#0A0F1D] p-2.5 rounded-lg border border-[#1A243B] max-h-32 overflow-y-auto">
                          {job.logs.map((log) => (
                            <div key={log.id} className="flex space-x-2 text-gray-300">
                              <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                              <span className="text-blue-400">[{log.level}]</span>
                              <span>{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs rounded-xl border border-dashed border-[#1E293B]">
                    No active SMS job currently tracked. Request an OTP on the login page to observe real-time queue dispatch and carrier ACK callbacks.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: API Request/Response Inspector */}
            {activeTab === 'inspector' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Recent HTTP Invocations (Captured in real time)</span>
                  <span className="mono text-[11px]">Backend: {health?.service || 'damayanti-otp-backend'}</span>
                </div>

                {traces.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs rounded-xl border border-dashed border-[#1E293B]">
                    No API calls logged yet. Request an OTP or click refresh to populate traces.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {traces.map((trace, i) => (
                      <details key={i} className="group p-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs font-mono">
                        <summary className="cursor-pointer flex items-center justify-between text-gray-300 hover:text-white select-none">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                trace.status >= 200 && trace.status < 300
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {trace.status || 'ERR'}
                            </span>
                            <span className="text-blue-400 font-bold">{trace.method}</span>
                            <span className="text-white">{trace.endpoint}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-500 text-[11px]">
                            <span>{trace.durationMs}ms</span>
                            <span>{trace.timestamp}</span>
                          </div>
                        </summary>

                        <div className="mt-3 pt-2.5 border-t border-[#1E293B] grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-gray-500 block mb-1">Payload Sent:</span>
                            <pre className="p-2 rounded bg-[#070B14] border border-[#1A243B] text-gray-300 overflow-x-auto">
                              {trace.requestBody ? JSON.stringify(trace.requestBody, null, 2) : '(none)'}
                            </pre>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Server Response:</span>
                            <pre className="p-2 rounded bg-[#070B14] border border-[#1A243B] text-gray-300 overflow-x-auto">
                              {JSON.stringify(trace.responseBody, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Testing Safeguards Control */}
            {activeTab === 'safeguards' && (
              <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3.5 text-xs text-gray-300">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Sovereign Security &amp; Compliance Enforcements</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0A0F1D] border border-[#1A243B] space-y-1.5">
                    <span className="font-semibold text-white block">Server-Side Compliance Mode</span>
                    <p className="text-gray-400 text-[11px]">
                      Currently active: <strong className="text-emerald-400 font-mono">{health?.complianceMode || 'DEVELOPMENT_MOCK'}</strong>
                    </p>
                    <ul className="text-[11px] text-gray-400 list-disc list-inside space-y-0.5">
                      <li><strong>DEVELOPMENT_MOCK:</strong> Mock SMS engine simulates carrier radio without SIM.</li>
                      <li><strong>DEVELOPMENT_RESTRICTED:</strong> Real SMS active ONLY for authorized whitelist.</li>
                      <li><strong>PRODUCTION_DLT:</strong> Enterprise commercial TRAI registered mode.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0A0F1D] border border-[#1A243B] space-y-1.5">
                    <span className="font-semibold text-white block">How to Enable Live BSNL SMS Testing</span>
                    <p className="text-gray-400 text-[11px]">
                      To send real cellular SMS via your Samsung Galaxy A35:
                    </p>
                    <ol className="text-[11px] text-gray-400 list-decimal list-inside space-y-1 font-mono">
                      <li>Edit <span className="text-white">backend/.env</span></li>
                      <li>Set <span className="text-blue-400">COMPLIANCE_MODE=DEVELOPMENT_RESTRICTED</span></li>
                      <li>Set <span className="text-blue-400">WHITELISTED_TEST_NUMBERS=+91XXXXXXXXXX</span></li>
                      <li>Install signed APK on Samsung Galaxy A35 and start service</li>
                    </ol>
                  </div>
                </div>

                <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-start space-x-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Carrier Protection Rule:</strong> To protect the phone owner from unauthorized carrier billing or SIM rate limits, arbitrary numbers cannot receive SMS without explicit configuration in the whitelist.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
