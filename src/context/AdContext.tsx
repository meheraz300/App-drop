import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface AdContextType {
  // Demo ads state - disabled for clean production state
  adsEnabled: boolean;
  setAdsEnabled: (enabled: boolean) => void;

  // App Open Demo Ad
  isAppOpenAdVisible: boolean;
  closeAppOpenAd: () => void;
  triggerAppOpenAd: () => void;

  // Anchored Adaptive Banner Demo Ad
  isBannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;

  // Interstitial Video Demo Ad
  isInterstitialVisible: boolean;
  showInterstitialVideo: (onDismissAndDownload: () => void) => void;
  closeInterstitialVideo: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo ads disabled for clean production state
  const [adsEnabled, setAdsEnabled] = useState<boolean>(false);

  // 1. Entry Ad (App Open Demo Format) - Disabled (false)
  const [isAppOpenAdVisible, setIsAppOpenAdVisible] = useState<boolean>(false);

  // 2. Persistent Header Banner Ad (Demo Format) - Disabled (false)
  const [isBannerVisible, setBannerVisible] = useState<boolean>(false);

  // 3. Download Interstitial Video Ad (Demo Format) - Disabled (false)
  const [isInterstitialVisible, setIsInterstitialVisible] = useState<boolean>(false);
  const pendingDownloadCallbackRef = useRef<(() => void) | null>(null);

  const closeAppOpenAd = useCallback(() => {
    setIsAppOpenAdVisible(false);
  }, []);

  const triggerAppOpenAd = useCallback(() => {
    // Disabled in clean production state
    setIsAppOpenAdVisible(false);
  }, []);

  const showInterstitialVideo = useCallback((onDismissAndDownload: () => void) => {
    // Demo ads disabled - immediately proceed to APK download without ad interruption
    onDismissAndDownload();
  }, []);

  const closeInterstitialVideo = useCallback(() => {
    setIsInterstitialVisible(false);
    const callback = pendingDownloadCallbackRef.current;
    pendingDownloadCallbackRef.current = null;
    if (callback) {
      callback();
    }
  }, []);

  return (
    <AdContext.Provider
      value={{
        adsEnabled,
        setAdsEnabled,
        isAppOpenAdVisible,
        closeAppOpenAd,
        triggerAppOpenAd,
        isBannerVisible,
        setBannerVisible,
        isInterstitialVisible,
        showInterstitialVideo,
        closeInterstitialVideo,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

export const useAds = (): AdContextType => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};
