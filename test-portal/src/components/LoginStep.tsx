import React, { useState } from 'react';
import { Smartphone, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
];

interface LoginStepProps {
  isLoading: boolean;
  error: string | null;
  onSendOtp: (fullPhoneNumber: string) => Promise<void>;
  defaultPhone?: string;
  complianceMode: string;
}

export const LoginStep: React.FC<LoginStepProps> = ({
  isLoading,
  error,
  onSendOtp,
  defaultPhone = '9876543210',
  complianceMode,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhone);
  const [inputError, setInputError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const clean = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhoneNumber(clean);
    setInputError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 8) {
      setInputError('Please enter a valid mobile number (minimum 8 digits).');
      return;
    }
    const fullNumber = `${selectedCountry}${phoneNumber}`;
    await onSendOtp(fullNumber);
  };

  const handleQuickFill = (num: string) => {
    setPhoneNumber(num);
    setInputError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#0D1424] border border-[#1A243B] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient effects */}
        <div className="ambient-glow -top-20 -right-20 w-44 h-44 bg-blue-500/20" />
        <div className="ambient-glow -bottom-20 -left-20 w-44 h-44 bg-purple-500/20" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 mb-3.5 shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
              <Smartphone className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Verify your mobile number using Damayanti OTP.
            </p>
          </div>

          {/* Test Safeguards Notice */}
          <div className="mb-6 p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-blue-400 font-semibold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Development Test Safeguards</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[9px] font-bold">
                {complianceMode}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Public registration is disabled. OTP messages are transmitted solely via our self-hosted infrastructure.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-blue-900/40 text-[10px]">
              <span className="text-gray-400">Authorized Test Numbers:</span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('9876543210')}
                  className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-mono transition-colors"
                >
                  9876543210
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('9999999999')}
                  className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-mono transition-colors"
                >
                  9999999999
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Mobile Phone Number
              </label>

              <div className="flex space-x-2">
                {/* Country Code Select */}
                <div className="relative w-32 shrink-0">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full appearance-none bg-[#141C30] border border-[#25324D] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs font-semibold px-3 py-3 rounded-xl outline-none transition-all cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0B1120] text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Number Input */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    autoFocus
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#141C30] border border-[#25324D] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm font-mono tracking-wide px-4 py-3 rounded-xl outline-none placeholder-gray-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                <span>Destination: <strong className="text-white mono">{selectedCountry} {phoneNumber || '••••••••••'}</strong></span>
                <span className="text-blue-400 font-medium">BSNL Gateway Ready</span>
              </div>
            </div>

            {/* Error & Validation Messages */}
            {(inputError || error) && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {inputError || error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !phoneNumber}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Dispatching OTP via Server...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[#1A243B] text-center text-[11px] text-gray-500 flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Encrypted with Argon2id • 60s Resend Cooldown</span>
          </div>
        </div>
      </div>
    </div>
  );
};
