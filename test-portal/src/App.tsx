import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LoginStep } from './components/LoginStep';
import { OtpStep } from './components/OtpStep';
import { SuccessStep } from './components/SuccessStep';
import { DevDashboard } from './components/DevDashboard';
import { api } from './services/api';
import { HealthResponse, VerifyOtpResponse, SmsJobStatusResponse, ApiTrace, SessionResponse } from './types/auth';

export const App: React.FC = () => {
  // Navigation / Step state
  const [currentStep, setCurrentStep] = useState<'login' | 'otp' | 'success'>('login');

  // Auth flow state
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(60);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);
  const [authData, setAuthData] = useState<VerifyOtpResponse | null>(null);

  // Loading & error state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Diagnostic state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [smsJobStatus, setSmsJobStatus] = useState<SmsJobStatusResponse | null>(null);
  const [traces, setTraces] = useState<ApiTrace[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(false);

  // Subscribe to API traces
  useEffect(() => {
    api.setTraceCallback((newTraces) => {
      setTraces([...newTraces]);
    });
  }, []);

  // Poll backend health every 8 seconds
  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (_) {
      setHealth(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Poll SMS job status while on OTP step
  useEffect(() => {
    if (!correlationId || currentStep !== 'otp') return;

    let isMounted = true;
    const fetchSmsStatus = async () => {
      try {
        const res = await api.getSmsStatus(correlationId);
        if (isMounted) setSmsJobStatus(res);
      } catch (_) {
        // Ignored
      }
    };

    fetchSmsStatus();
    const interval = setInterval(fetchSmsStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [correlationId, currentStep]);

  // Handlers
  const handleSendOtp = async (fullPhone: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.requestOtp(fullPhone);
      setPhoneNumber(fullPhone);
      setCorrelationId(res.correlationId || null);
      setCooldownSeconds(res.cooldownSeconds || 60);
      setDevCode(res.devCode);
      setCurrentStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!correlationId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.verifyOtp(correlationId, code);
      setAuthData(res);
      setCurrentStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!correlationId) return;
    setErrorMessage(null);
    try {
      const res = await api.resendOtp(correlationId);
      setCorrelationId(res.correlationId || null);
      setCooldownSeconds(res.cooldownSeconds || 60);
      setDevCode(res.devCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP');
    }
  };

  const handleLogout = async () => {
    if (authData?.sessionToken) {
      try {
        await api.logout(authData.sessionToken);
      } catch (_) {}
    }
    // Reset flow
    setCurrentStep('login');
    setCorrelationId(null);
    setAuthData(null);
    setDevCode(undefined);
    setSmsJobStatus(null);
    setErrorMessage(null);
  };

  const handleCheckSession = async (): Promise<SessionResponse> => {
    if (!authData?.sessionToken) throw new Error('No session active');
    return api.getSession(authData.sessionToken);
  };

  const handleChangeNumber = () => {
    setCurrentStep('login');
    setErrorMessage(null);
  };

  const isBackendHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-between selection:bg-blue-600/30 selection:text-white">
      {/* Top Header */}
      <Header
        health={health}
        isBackendHealthy={isBackendHealthy}
        onRefreshHealth={fetchHealth}
      />

      {/* Main Form Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col items-center justify-center">
        {currentStep === 'login' && (
          <LoginStep
            isLoading={isLoading}
            error={errorMessage}
            onSendOtp={handleSendOtp}
            defaultPhone="9876543210"
            complianceMode={health?.complianceMode || 'DEVELOPMENT_MOCK'}
          />
        )}

        {currentStep === 'otp' && (
          <OtpStep
            phoneNumber={phoneNumber}
            correlationId={correlationId || ''}
            cooldownSeconds={cooldownSeconds}
            devCode={devCode}
            isLoading={isLoading}
            error={errorMessage}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onChangeNumber={handleChangeNumber}
          />
        )}

        {currentStep === 'success' && authData && (
          <SuccessStep
            authData={authData}
            onLogout={handleLogout}
            onCheckSession={handleCheckSession}
          />
        )}

        {/* Live Diagnostics Dashboard */}
        <DevDashboard
          health={health}
          smsJobStatus={smsJobStatus}
          traces={traces}
          correlationId={correlationId}
          onRefreshAll={fetchHealth}
          isLoadingHealth={isLoadingHealth}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A243B] bg-[#0A0F1D]/80 py-5 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Damayanti Technologies. Self-Hosted Sovereign Infrastructure.</span>
          <span className="font-mono text-[11px] text-gray-400">
            Damayanti OTP v1.0.0 • Connected to Node.js / Express Core
          </span>
        </div>
      </footer>
    </div>
  );
};
