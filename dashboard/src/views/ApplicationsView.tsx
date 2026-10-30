import React from 'react';
import { Layers, Globe, Shield, Activity } from 'lucide-react';

export const ApplicationsView: React.FC = () => {
  const applications = [
    {
      appId: 'damayanti_arrout',
      name: 'ARROUT Platform',
      domain: 'arrout.damayanticrest.online',
      description: 'Production authentication client for arrout.damayanticrest.online portal.',
      allowedOrigins: ['https://arrout.damayanticrest.online', 'http://localhost:3000'],
      rateLimit: '60 req/min',
      status: 'ACTIVE',
      totalOtps: 42,
    },
    {
      appId: 'damayanti_main_portal',
      name: 'Damayanti Corporate Portal',
      domain: 'damayanticrest.online',
      description: 'Official corporate and customer verification service.',
      allowedOrigins: ['https://damayanticrest.online'],
      rateLimit: '120 req/min',
      status: 'ACTIVE',
      totalOtps: 18,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Connected Applications
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage web platforms, permitted CORS origins, and application-specific rate limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {applications.map((app) => (
          <div
            key={app.appId}
            className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-4 hover:border-blue-500/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {app.appId}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{app.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{app.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {app.status}
              </span>
            </div>

            <div className="pt-3 border-t border-[#1F2937] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-500" /> Allowed Origins:
                </span>
                <span className="text-gray-200 font-mono text-[11px]">{app.allowedOrigins.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-gray-500" /> Rate Limit:
                </span>
                <span className="text-white font-medium">{app.rateLimit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
