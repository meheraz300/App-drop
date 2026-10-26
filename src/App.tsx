/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AdProvider } from './context/AdContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MaintenanceBanner } from './components/public/MaintenanceBanner';
import { HomeView } from './components/public/HomeView';
import { AppDetailsView } from './components/public/AppDetailsView';
import { StaticPages } from './components/public/StaticPages';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AppManager } from './components/admin/AppManager';
import { ApkUploader } from './components/admin/ApkUploader';
import { VersionManager } from './components/admin/VersionManager';
import { AnalyticsView } from './components/admin/AnalyticsView';
import { StorageView } from './components/admin/StorageView';
import { ActivityLogView } from './components/admin/ActivityLogView';
import { SettingsView } from './components/admin/SettingsView';

import { AdMobAppOpenDemo } from './components/ads/AdMobAppOpenDemo';
import { AdMobBannerDemo } from './components/ads/AdMobBannerDemo';
import { AdMobInterstitialVideoDemo } from './components/ads/AdMobInterstitialVideoDemo';

import { GlassBackdrop } from './components/common/GlassComponents';

const AppContent: React.FC = () => {
  const { currentRoute, isAdmin } = useApp();

  const renderContent = () => {
    // Public Routes
    if (currentRoute === 'home' || currentRoute === 'categories') {
      return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HomeView />
        </div>
      );
    }

    if (currentRoute === 'app-details') {
      return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AppDetailsView />
        </div>
      );
    }

    if (['about', 'privacy', 'terms', 'contact'].includes(currentRoute)) {
      return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaticPages type={currentRoute as any} />
        </div>
      );
    }

    // Admin Authentication Route
    if (currentRoute === 'admin-login') {
      return <AdminLogin />;
    }

    // Protected Admin Routes (Require isAdmin, fallback to AdminLogin)
    if (!isAdmin) {
      return <AdminLogin />;
    }

    // Admin Routes with AdminLayout
    switch (currentRoute) {
      case 'admin-dashboard':
        return (
          <AdminLayout activeSection="Overview Dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      case 'admin-apps':
        return (
          <AdminLayout activeSection="Application Inventory">
            <AppManager />
          </AdminLayout>
        );
      case 'admin-upload':
        return (
          <AdminLayout activeSection="Upload & Publish APK">
            <ApkUploader />
          </AdminLayout>
        );
      case 'admin-versions':
        return (
          <AdminLayout activeSection="Version Rollback & Release Notes">
            <VersionManager />
          </AdminLayout>
        );
      case 'admin-analytics':
        return (
          <AdminLayout activeSection="Download Request Metrics">
            <AnalyticsView />
          </AdminLayout>
        );
      case 'admin-storage':
        return (
          <AdminLayout activeSection="Storage Utilization & Limits">
            <StorageView />
          </AdminLayout>
        );
      case 'admin-activity':
        return (
          <AdminLayout activeSection="Audit Logs & Activity Trail">
            <ActivityLogView />
          </AdminLayout>
        );
      case 'admin-settings':
        return (
          <AdminLayout activeSection="System Configuration">
            <SettingsView />
          </AdminLayout>
        );
      default:
        return (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HomeView />
          </div>
        );
    }
  };

  const isAdminRoute = currentRoute.startsWith('admin-') && currentRoute !== 'admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--lg-ink)] font-sans selection:bg-[var(--lg-accent-start)]/20 selection:text-[var(--lg-accent-start)]">
      <GlassBackdrop />
      <Navbar />
      {/* 2. Persistent Header Banner Ad (Demo Format) - Anchored adaptive banner below navigation bar */}
      <AdMobBannerDemo />
      <MaintenanceBanner />
      <main className="flex-1 min-w-0">{renderContent()}</main>
      {!isAdminRoute && <Footer />}

      {/* 1. Entry Ad (App Open Demo Format) - Triggers on initial load */}
      <AdMobAppOpenDemo />

      {/* 3. Download Interstitial Video Ad (Demo Format) - Triggers on Download APK */}
      <AdMobInterstitialVideoDemo />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AdProvider>
        <AppContent />
      </AdProvider>
    </AppProvider>
  );
}
