import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);
  const prevConnectedRef = useRef(isConnected);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Transition from offline to online: show restored notification
    if (!prevConnectedRef.current && isConnected) {
      setShowRestored(true);
      timer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);
    }

    prevConnectedRef.current = isConnected;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md z-[99999] animate-in slide-in-from-top duration-200"
      >
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <span>You are currently offline. Check your internet connection.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md z-[99999] animate-in slide-in-from-top duration-200"
      >
        <Wifi className="w-4 h-4 shrink-0 text-emerald-200" />
        <span>Internet connection restored.</span>
      </div>
    );
  }

  return null;
};
