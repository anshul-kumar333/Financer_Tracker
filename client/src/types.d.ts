// PWA TypeScript type definitions
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  
  prompt(): Promise<void>;
}

interface Window {
  deferredInstallPrompt?: BeforeInstallPromptEvent;
}

// Service Worker registration with additional PWA features
interface ServiceWorkerRegistration {
  // Background Sync API
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
  
  // Periodic Sync API
  periodicSync?: {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
  
  // Push API
  pushManager: PushManager;
}

// Permissions API
interface Permissions {
  query(permissionDesc: { name: PermissionName }): Promise<PermissionStatus>;
}

type PermissionName = 
  | 'geolocation'
  | 'notifications'
  | 'push'
  | 'midi'
  | 'camera'
  | 'microphone'
  | 'speaker'
  | 'device-info'
  | 'background-fetch'
  | 'background-sync'
  | 'bluetooth'
  | 'persistent-storage'
  | 'ambient-light-sensor'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'clipboard'
  | 'display-capture'
  | 'nfc'
  | 'periodic-background-sync';

// Notification options with vibration
interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  silent?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}