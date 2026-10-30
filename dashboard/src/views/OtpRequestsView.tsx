import React from 'react';
import { KeyRound, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const OtpRequestsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          OTP Request &amp; Cryptographic Validation Audit
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Inspection log of all issued authentication requests, Argon2id security hashes, and attempt limits.
        </p>
      </div>

      <div className="bg-[#0E1322] border border-[#1F2937] rounded-xl p-6">
        <div className="flex items-start space-x-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Zero-Plaintext Security Policy Active:</span> Plaintext 6-digit OTP
            codes are NEVER stored in this database or shown on this dashboard. Verification queries compare user input
            directly against memory-hard Argon2id hashes.
          </div>
        </div>

        <div className="mt-6 border-t border-[#1F2937] pt-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Active Cryptographic Protection Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937]">
              <span className="text-gray-400 font-medium">OTP Code Length:</span>
              <p className="text-white font-bold mt-1 text-sm">6-digit cryptographically random numeric string</p>
            </div>
            <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Hashing Algorithm:</span>
              <p className="text-emerald-400 font-bold mt-1 font-mono text-sm">Argon2id (m=65536, t=3, p=4)</p>
            </div>
            <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Brute Force Mitigation:</span>
              <p className="text-white font-bold mt-1 text-sm">5 attempts maximum before permanent invalidation</p>
            </div>
            <div className="bg-[#12182B] p-4 rounded-lg border border-[#1F2937]">
              <span className="text-gray-400 font-medium">Request Cooldown:</span>
              <p className="text-white font-bold mt-1 text-sm">60 seconds per phone number</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
