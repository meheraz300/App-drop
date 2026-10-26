import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface AdContextType {
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
  // 1. Entry Ad (App Open Demo Format) - Triggers when the website initially loads and opens in the browser
  const [isAppOpenAdVisible, setIsAppOpenAdVisible] = useState<boolean>(true);

  // 2. Persistent Header Banner Ad (Demo Format) - Anchored adaptive banner
  const [isBannerVisible, setBannerVisible] = useState<boolean>(true);

  // 3. Download Interstitial Video Ad (Demo Format)
  const [isInterstitialVisible, setIsInterstitialVisible] = useState<boolean>(false);
  const pendingDownloadCallbackRef = useRef<(() => void) | null>(null);

  const closeAppOpenAd = useCallback(() => {
    setIsAppOpenAdVisible(false);
  }, []);

  const triggerAppOpenAd = useCallback(() => {
    setIsAppOpenAdVisible(true);
  }, []);

  const showInterstitialVideo = useCallback((onDismissAndDownload: () => void) => {
    pendingDownloadCallbackRef.current = onDismissAndDownload;
    setIsInterstitialVisible(true);
  }, []);

  const closeInterstitialVideo = useCallback(() => {
    setIsInterstitialVisible(false);
    const callback = pendingDownloadCallbackRef.current;
    pendingDownloadCallbackRef.current = null;
    if (callback) {
      // Trigger the APK download process immediately upon closing
      callback();
    }
  }, []);

  return (
    <AdContext.Provider
      value={{
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
