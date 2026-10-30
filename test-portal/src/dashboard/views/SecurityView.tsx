import React from 'react';
import { ShieldCheck, Lock, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const securityPillars = [
    {
      title: 'Memory-Hard Argon2id Hashing',
      desc: 'All passwords, API credentials, device tokens, and OTP codes are hashed with Argon2id using 64 MB of RAM cost. Even full database compromises cannot decrypt in-flight codes.',
      status: 'Enforced',
    },
    {
      title: 'Outbound Device Polling & Mutual Authentication',
      desc: 'The Android phone makes outbound authenticated HTTPS polling connections to the laptop. The phone never opens listening ports or accepts unsolicited commands.',
      status: 'Active',
    },
    {
      title: 'Cryptographic HMAC Request Signing',
      desc: 'Device requests are signed with HMAC-SHA256 and include an incremental timestamp window to prevent packet eavesdropping and replay attacks.',
      status: 'Active',
    },
    {
      title: 'Carrier Status Disambiguation',
      desc: 'The SMS engine differentiates local queuing, radio submission, and uncertain transmission outcomes to eliminate duplicate OTP dispatches.',
      status: 'Enforced',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Security Architecture &amp; Audit Trail
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Cybersecurity controls, threat defense configurations, and tamper-resistant audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPillars.map((pillar, idx) => (
          <div key={idx} className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {pillar.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{pillar.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
