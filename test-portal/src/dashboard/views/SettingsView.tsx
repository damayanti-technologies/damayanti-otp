import React from 'react';
import { Settings, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          System Settings &amp; Carrier Compliance
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Indian TRAI/DLT regulations, BSNL SIM compliance mode, and server network bindings.
        </p>
      </div>

      <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between pb-4 border-b border-[#1F2937]">
          <div>
            <h3 className="text-base font-bold text-white">Compliance &amp; Sending Lock</h3>
            <p className="text-xs text-gray-400 mt-1">
              Indian regulatory policy requires explicit commercial authorization before sending customer-facing automated SMS.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            DEVELOPMENT_MOCK Active
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937] space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Mode 1: DEVELOPMENT_MOCK (Current)
            </h4>
            <p className="text-gray-400">
              Dispatches are simulated in memory without transmitting physical cellular signals. Ideal for end-to-end API
              testing, website logins, and local dev.
            </p>
          </div>

          <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937] space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Mode 2: DEVELOPMENT_RESTRICTED (Phase 6 Real SMS)
            </h4>
            <p className="text-gray-400">
              Only phone numbers explicitly configured in <code className="text-violet-400 font-mono">WHITELISTED_TEST_NUMBERS</code>{' '}
              can receive real SMS. All other numbers are immediately blocked by the compliance gate.
            </p>
            <p className="text-emerald-400 font-mono font-medium">Configured Test Whitelist: +919876543210, +919999999999</p>
          </div>

          <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937] space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              Mode 3: PRODUCTION_DLT (Commercial Mass Blast)
            </h4>
            <p className="text-gray-400">
              Requires registration on a TRAI-authorized DLT portal (e.g. BSNL Vilpower DLT) with registered Principal Entity ID
              and Header ID. Personal prepaid SIMs must not be used for unsolicited mass marketing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
