import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Copy, Check, LogOut, RefreshCw, Server } from 'lucide-react';
import { VerifyOtpResponse, SessionResponse } from '../types/auth';

interface SuccessStepProps {
  authData: VerifyOtpResponse;
  onLogout: () => Promise<void>;
  onCheckSession: () => Promise<SessionResponse>;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ authData, onLogout, onCheckSession }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [sessionCheck, setSessionCheck] = useState<SessionResponse | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const token = authData.sessionToken || '';
  const user = authData.user;

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidateSession = async () => {
    setIsChecking(true);
    try {
      const res = await onCheckSession();
      setSessionCheck(res);
    } catch (_) {
      // Ignored
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#0D1424] border border-[#1A243B] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient effects */}
        <div className="ambient-glow -top-20 -right-20 w-44 h-44 bg-emerald-500/20" />
        <div className="ambient-glow -bottom-20 -left-20 w-44 h-44 bg-blue-500/20" />

        <div className="relative z-10 text-center">
          {/* Animated Success Badge */}
          <div className="relative inline-flex mb-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">Authentication Confirmed</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Identity cryptographically verified by Damayanti OTP Engine.
          </p>

          {/* Session Data Card */}
          <div className="mt-6 bg-[#12192C] border border-[#212E4A] rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1E293B] text-xs">
              <span className="text-gray-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                Active Session
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Authenticated Phone:</span>
              <span className="font-mono font-bold text-white text-sm">{user?.phoneNumber}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">User Identifier:</span>
              <span className="font-mono text-gray-300 text-[11px] truncate max-w-[180px]">{user?.id}</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Bearer Session Token:</span>
                <button
                  onClick={handleCopy}
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center space-x-1 text-[11px] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-[#0A0F1D] border border-[#1A253D] font-mono text-[11px] text-gray-300 break-all select-all">
                {token}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center space-x-1">
                <Server className="w-3 h-3 text-blue-400" />
                <span>Host: Galaxy Book 4 (Win 11)</span>
              </span>
              <span className="text-emerald-400 font-medium">BSNL Gateway Verified</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleValidateSession}
              disabled={isChecking}
              className="w-full bg-[#18233C] hover:bg-[#202E4E] text-gray-200 font-semibold py-2.5 px-4 rounded-xl text-xs border border-[#2B3B5E] transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-blue-400' : ''}`} />
              <span>Validate Session (GET /api/v1/auth/session)</span>
            </button>

            {sessionCheck && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] text-left">
                ✓ Session active on server. Expires at: {new Date(sessionCheck.expiresAt || '').toLocaleTimeString()}
              </div>
            )}

            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="w-full bg-[#1A202C] hover:bg-rose-950/30 hover:border-rose-800/40 hover:text-rose-300 text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-xs border border-[#2D3748] transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Terminating Session...' : 'Sign Out & Terminate Session'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
