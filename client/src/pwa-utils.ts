// PWA utilities for the पैसा ट्रैकर app

/**
 * Registers the service worker for PWA functionality
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        // Set up update handling
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          }
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
    
    // Handle service worker messages (e.g., sync completion)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        console.log(`Sync complete for ${event.data.payload.feature}`);
        // Dispatch custom event that components can listen for
        window.dispatchEvent(new CustomEvent('synccomplete', { 
          detail: event.data.payload 
        }));
      }
    });
  }
}

/**
 * Shows a notification that a new version of the app is available
 */
function showUpdateNotification() {
  // Dispatch custom event that components can listen for
  window.dispatchEvent(new CustomEvent('appupdate'));
  
  // You can also add a custom UI notification here
  console.log('New version of the app is available');
}

/**
 * Checks if the app is installed as a PWA
 */
export function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: fullscreen)').matches || 
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         (window.navigator as any).standalone === true; // iOS Safari
}

/**
 * Prompts the user to install the PWA
 * @param promptEvent The beforeinstallprompt event to use for installation
 */
export function showInstallPrompt(promptEvent: any) {
  if (!promptEvent) {
    console.error('No installation prompt event available');
    return;
  }
  
  promptEvent.prompt();
  
  // Wait for user to respond to prompt
  promptEvent.userChoice.then((choiceResult: any) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
  });
}

/**
 * Sets up online/offline status listeners and UI updates
 * @param setIsOnline Function to update online status in the app state
 * @param syncData Function to trigger data synchronization when coming online
 */
export function setupOnlineStatusListeners(
  setIsOnline: (status: boolean) => void,
  syncData?: () => void
) {
  // Set initial status
  setIsOnline(navigator.onLine);
  
  // Listen for connection changes
  window.addEventListener('online', () => {
    setIsOnline(true);
    
    // Trigger data sync if provided
    if (syncData) {
      syncData();
    }
    
    // Request background sync for transactions
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.sync) {
          registration.sync.register('sync-transactions')
            .catch((error: Error) => console.error('Sync registration failed:', error));
          
          registration.sync.register('sync-reminders')
            .catch((error: Error) => console.error('Reminders sync registration failed:', error));
        } else {
          console.log('Background Sync API not supported');
        }
      });
    }
  });
  
  window.addEventListener('offline', () => {
    setIsOnline(false);
  });
}

/**
 * Initializes the install prompt listener for PWA installation
 * @param setInstallPrompt Function to save the installation prompt event in state
 */
export function initInstallPrompt(setInstallPrompt: (event: any) => void) {
  // This prevents the browser's default install prompt and saves the event for later
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent default browser prompt
    event.preventDefault();
    
    // Save the event for later use
    setInstallPrompt(event);
  });
  
  // Listen for installation completion
  window.addEventListener('appinstalled', () => {
    // Clear the saved prompt
    setInstallPrompt(null);
    
    console.log('PWA was installed successfully');
  });
}

/**
 * Registers the app for periodic background sync
 * Only works in supported browsers when the app is installed
 * @param minInterval Minimum interval in milliseconds between syncs
 */
export async function registerPeriodicSync(minInterval = 24 * 60 * 60 * 1000) {
  if (!('serviceWorker' in navigator) || !('PeriodicSyncManager' in window)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if periodic sync is supported and permission is granted
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });
    
    if (status.state !== 'granted') {
      return false;
    }
    
    // Register for daily sync
    if (registration.periodicSync) {
      await registration.periodicSync.register('daily-sync', {
        minInterval,
      });
    } else {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to register for periodic sync:', error);
    return false;
  }
}

/**
 * Checks if notification permission is granted and requests it if needed
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  // Already granted
  if (Notification.permission === 'granted') {
    return true;
  }
  
  // Denied previously
  if (Notification.permission === 'denied') {
    console.log('Notification permission was denied');
    return false;
  }
  
  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Shows a notification with sound
 * @param title Notification title
 * @param options Notification options
 * @param soundUrl URL to the sound file to play
 */
export function showNotificationWithSound(
  title: string, 
  options: NotificationOptions, 
  soundUrl: string = '/sounds/notification.mp3'
): void {
  // Show notification if permission is granted
  if (Notification.permission === 'granted') {
    // Play notification sound
    const audio = new Audio(soundUrl);
    audio.play().catch(e => console.error('Failed to play notification sound:', e));
    
    // Show notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker to show notification (works when app is in background)
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      // Fallback to regular notification (works when app is open)
      new Notification(title, options);
    }
  }
}

/**
 * Shares the app with other users
 */
export async function shareApp(): Promise<boolean> {
  if (!navigator.share) {
    console.log('Web Share API not supported');
    return false;
  }
  
  try {
    await navigator.share({
      title: 'पैसा ट्रैकर - Personal Finance App',
      text: 'Check out this awesome finance tracking app!',
      url: window.location.origin,
    });
    return true;
  } catch (error) {
    console.error('Error sharing app:', error);
    return false;
  }
}