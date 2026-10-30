import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, RotateCcw, AlertCircle, ArrowLeft, Check } from 'lucide-react';

interface OtpStepProps {
  phoneNumber: string;
  correlationId: string;
  cooldownSeconds: number;
  devCode?: string; // Development mock convenience code
  isLoading: boolean;
  error: string | null;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeNumber: () => void;
}

export const OtpStep: React.FC<OtpStepProps> = ({
  phoneNumber,
  correlationId,
  cooldownSeconds,
  devCode,
  isLoading,
  error,
  onVerify,
  onResend,
  onChangeNumber,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [remainingCooldown, setRemainingCooldown] = useState<number>(cooldownSeconds || 60);
  const [isResending, setIsResending] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    setRemainingCooldown(cooldownSeconds || 60);
    const interval = setInterval(() => {
      setRemainingCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Mask phone number: e.g., +91 98•••• ••10
  const maskPhone = (num: string) => {
    if (num.length <= 5) return num;
    const firstTwo = num.slice(0, num.length - 8);
    const middlePart = '••••••';
    const lastTwo = num.slice(-2);
    return `${firstTwo} ${middlePart} ${lastTwo}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits filled, trigger verify automatically
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      onVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, 6);

    if (cleanNumbers.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < cleanNumbers.length; i++) {
        newDigits[i] = cleanNumbers[i];
      }
      setDigits(newDigits);

      // Focus the next empty box or the 6th box
      const targetIndex = Math.min(cleanNumbers.length, 5);
      inputRefs.current[targetIndex]?.focus();

      if (cleanNumbers.length === 6) {
        onVerify(cleanNumbers);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length === 6) {
      onVerify(fullCode);
    }
  };

  const handleResendClick = async () => {
    if (remainingCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  const fillDevCode = () => {
    if (!devCode) return;
    const newDigits = devCode.split('').slice(0, 6);
    setDigits(newDigits);
    inputRefs.current[5]?.focus();
    onVerify(devCode);
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#0D1424] border border-[#1A243B] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient effects */}
        <div className="ambient-glow -top-20 -right-20 w-44 h-44 bg-purple-500/20" />
        <div className="ambient-glow -bottom-20 -left-20 w-44 h-44 bg-blue-500/20" />

        <div className="relative z-10">
          {/* Back button */}
          <button
            type="button"
            onClick={onChangeNumber}
            className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Phone Number</span>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 mb-3.5 shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
              <KeyRound className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Enter Verification Code</h2>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              We sent a 6-digit OTP code to:
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono font-bold text-blue-300">
              {maskPhone(phoneNumber)}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label className="block text-center text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Security Code (6 Digits)
              </label>

              {/* 6 Individual OTP Boxes */}
              <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-12 h-14 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border outline-none transition-all ${
                      digit
                        ? 'border-blue-500 bg-[#16223B] text-white shadow-md shadow-blue-500/20'
                        : 'border-[#25324D] bg-[#141C30] text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                ))}
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between mt-4 text-xs">
                <span className="text-gray-400 font-medium">
                  Expires in: <strong className="text-white mono">05:00</strong>
                </span>

                <button
                  type="button"
                  onClick={handleResendClick}
                  disabled={remainingCooldown > 0 || isResending}
                  className="inline-flex items-center space-x-1.5 text-blue-400 disabled:text-gray-600 hover:text-blue-300 font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {remainingCooldown > 0
                      ? `Resend in ${remainingCooldown}s`
                      : 'Resend Code'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Verification Failed</span>
                  {error}
                </div>
              </div>
            )}

            {/* Dev Mock Autofill Helper (Test Mode Only) */}
            {devCode && (
              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider block">
                    Mock Mode Dispatched OTP:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm tracking-widest">{devCode}</span>
                </div>
                <button
                  type="button"
                  onClick={fillDevCode}
                  className="px-2.5 py-1 rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 text-xs font-semibold border border-violet-500/30 transition-colors"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isComplete}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validating Argon2id Hash...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verify OTP &amp; Authenticate</span>
                </>
              )}
            </button>
          </form>

          {/* Correlation ID Tag */}
          <div className="mt-6 pt-4 border-t border-[#1A243B] flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>Tracking ID:</span>
            <span className="text-gray-400 truncate max-w-[220px]" title={correlationId}>{correlationId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
