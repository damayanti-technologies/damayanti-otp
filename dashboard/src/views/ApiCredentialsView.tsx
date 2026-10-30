import React, { useState } from 'react';
import { Lock, Copy, Check, Key } from 'lucide-react';

export const ApiCredentialsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  // Active Seed Key for arrout.damayanticrest.online
  const activeKeyPrefix = 'dmy_live_';
  const activeKeySample = 'dmy_live_secret_dev_key_arrout_2026';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeKeySample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-violet-400" />
          API Credentials &amp; Access Keys
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Cryptographic keys used by external web platforms (e.g. arrout.damayanticrest.online) to authenticate API requests.
        </p>
      </div>

      <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2937]">
          <div>
            <h3 className="text-sm font-bold text-white">Default Development API Key</h3>
            <p className="text-xs text-gray-400">Assigned to: ARROUT Platform (damayanti_arrout)</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <span className="text-gray-400 font-medium">Secret Key (Argon2id Hashed in DB):</span>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-[#12182B] border border-[#1F2937] px-3.5 py-2.5 rounded-lg font-mono text-gray-200 text-xs">
              {activeKeySample}
            </div>
            <button
              onClick={copyToClipboard}
              className="px-3 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Pass this value in the <code className="text-violet-400 font-mono">X-Api-Key</code> or{' '}
            <code className="text-violet-400 font-mono">Authorization: Bearer &lt;key&gt;</code> header.
          </p>
        </div>
      </div>
    </div>
  );
};
