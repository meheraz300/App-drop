import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wrench } from 'lucide-react';
import { GlassSurface } from '../common/GlassComponents';

export const MaintenanceBanner: React.FC = () => {
  const { systemConfig, isAdmin, navigateTo } = useApp();

  if (!systemConfig.maintenanceMode) {
    return null;
  }

  return (
    <div className="pt-3 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <GlassSurface
          variant="floating"
          className="px-5 py-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-amber-300 dark:border-amber-600 bg-amber-500/20 text-[var(--lg-ink)]"
        >
          <div className="flex items-center gap-2.5 font-medium">
            <Wrench className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold">Maintenance Mode Active:</span>
            <span>{systemConfig.maintenanceMessage}</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigateTo('admin-settings')}
              className="text-xs font-bold text-[var(--lg-accent-start)] hover:underline glass-pressable"
            >
              Manage in Settings
            </button>
          )}
        </GlassSurface>
      </div>
    </div>
  );
};
