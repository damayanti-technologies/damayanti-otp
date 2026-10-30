import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { ApplicationsView } from './views/ApplicationsView';
import { GatewayView } from './views/GatewayView';
import { DevicesView } from './views/DevicesView';
import { OtpRequestsView } from './views/OtpRequestsView';
import { MessageHistoryView } from './views/MessageHistoryView';
import { ApiCredentialsView } from './views/ApiCredentialsView';
import { SecurityView } from './views/SecurityView';
import { SettingsView } from './views/SettingsView';
import { api } from './services/api';
import { DashboardData, TabId } from './types';

export const DashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView data={dashboardData} onNavigate={setActiveTab} />;
      case 'applications':
        return <ApplicationsView />;
      case 'gateway':
        return <GatewayView data={dashboardData} />;
      case 'devices':
        return <DevicesView />;
      case 'otp-requests':
        return <OtpRequestsView />;
      case 'messages':
        return <MessageHistoryView />;
      case 'credentials':
        return <ApiCredentialsView />;
      case 'security':
        return <SecurityView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView data={dashboardData} onNavigate={setActiveTab} />;
    }
  };

  const isOnline = dashboardData?.gateway.isOnline || false;
  const activeDeviceCount = dashboardData?.gateway.activeDeviceCount || 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          isOnline={isOnline}
          activeDeviceCount={activeDeviceCount}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{renderActiveView()}</main>
      </div>
    </div>
  );
};
