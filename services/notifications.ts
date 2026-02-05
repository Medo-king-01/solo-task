
import { ToastType } from "../types";

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  },

  /**
   * Sends a notification purely to the system (Browser/OS)
   * Uses ServiceWorkerRegistration if available for better Android support.
   */
  sendExternal: async (title: string, body?: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      // Cast to 'any' to allow 'vibrate' property which is not in standard TS definition but works on Android
      const options: any = {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991195.png', // Solo Level Icon style
        badge: 'https://cdn-icons-png.flaticon.com/512/2991/2991195.png', // Android Badge
        tag: 'solo-level-game', // Prevents duplicate notifications
        silent: false,
        vibrate: [200, 100, 200]
      };

      try {
        // Method 1: Try Service Worker (Best for PWA/Android)
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, options);
                return;
            }
        }

        // Method 2: Standard Fallback
        new Notification(title, options);
      } catch (e) {
        console.error("Notification Error:", e);
      }
    }
  },

  /**
   * Smart Dispatch:
   * - If app is VISIBLE (User is looking at it) -> Show In-App Toast.
   * - If app is HIDDEN (Background tab/minimized) -> Show System Notification.
   */
  dispatch: (
    title: string, 
    body: string, 
    addToast: (msg: string, type: ToastType) => void,
    type: ToastType = 'info',
    forceExternal: boolean = false
  ) => {
    if (!forceExternal && document.visibilityState === 'visible') {
      // User is IN the app -> Use Toast (Internal)
      // Combine title and body for toast
      addToast(`${title}: ${body}`, type);
    } else {
      // User is OUT of the app -> Use System Notification (External)
      NotificationService.sendExternal(title, body);
    }
  },

  hasPermission: (): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  }
};
