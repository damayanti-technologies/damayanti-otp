import React from 'react';
import { Smartphone, Download, Radio, ShieldCheck, CheckCircle2, Cpu, Battery, Wifi } from 'lucide-react';

export const AndroidGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Sovereign Hardware Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Samsung Galaxy A35 Gateway
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-xl">
              Transmits authorized OTP SMS messages directly using your installed BSNL SIM. No paid third-party SMS APIs (Twilio, MSG91, Firebase) required.
            </p>
          </div>

          <a
            href="https://github.com/damayanti-technologies/damayanti-otp/raw/main/release-apk/damayanti-gateway-v1.0.0-release.apk"
            download
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-blue-500/25 border border-white/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download Release APK</span>
          </a>
        </div>
      </div>

      {/* Hardware Specs & Compatibility Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Target Hardware</div>
            <div className="text-sm font-bold text-white">Samsung SM-A356E</div>
          </div>
        </div>

        <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Transmitter Carrier</div>
            <div className="text-sm font-bold text-emerald-300">BSNL Mobile SIM</div>
          </div>
        </div>

        <div className="bg-[#0D1424] border border-[#1E293B] rounded-xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Build Version</div>
            <div className="text-sm font-bold text-purple-300">v1.0.0 (Signed Release)</div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-[#0D1424] border border-[#1E293B] rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
          <span>Quick 3-Step Setup Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-[#070B14] border border-[#1E293B] rounded-xl p-5 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500 text-white font-black text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Install APK</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Transfer <code className="text-blue-300 bg-blue-950/50 px-1 py-0.5 rounded">damayanti-gateway-v1.0.0-release.apk</code> to your phone and install it, or execute via USB debugging:
            </p>
            <div className="bg-black/50 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-gray-300 overflow-x-auto">
              adb install -r release-apk\damayanti-gateway-v1.0.0-release.apk
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#070B14] border border-[#1E293B] rounded-xl p-5 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Permissions</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Open the app and grant required Android permissions:
            </p>
            <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-blue-300">SEND_SMS:</strong> Dispatches OTPs</li>
              <li><strong className="text-indigo-300">READ_PHONE_STATE:</strong> Identifies BSNL SIM carrier</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-[#070B14] border border-[#1E293B] rounded-xl p-5 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500 text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Pair with Server</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Enter your Galaxy Book 4 laptop's local IP address and default pairing token:
            </p>
            <div className="bg-black/50 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-gray-300 space-y-1">
              <div><span className="text-gray-500">URL:</span> http://192.168.1.X:4000</div>
              <div><span className="text-gray-500">Token:</span> dev-device-pair-token-2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
