// Service Worker for पैसा ट्रैकर PWA

const CACHE_NAME = 'paisa-tracker-v1';
const OFFLINE_URL = '/offline.html';

// Assets to be cached immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/sounds/notification.mp3'
];

// Frequently accessed API routes to cache
const API_ROUTES = [
  '/api/user',
  '/api/transactions'
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching precache assets');
      await cache.addAll(PRECACHE_ASSETS);
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(name => name !== CACHE_NAME)
        .map(name => caches.delete(name));
      
      await Promise.all(deletePromises);
      await self.clients.claim();
      console.log('[Service Worker] Activated and controlling');
    })()
  );
});

// Fetch event - for network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For API routes, try network first, then cache
  if (request.url.includes('/api/')) {
    const apiCacheStrategy = async () => {
      try {
        // Try network first
        const networkResponse = await fetch(request);
        // Clone response for cache
        const responseToCache = networkResponse.clone();
        
        // Only cache GET requests and successful responses
        if (request.method === 'GET' && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, responseToCache);
        }
        
        return networkResponse;
      } catch (error) {
        console.log('[Service Worker] Fetch failed, serving from cache', error);
        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If no cache for API, return generic error response
        return new Response(
          JSON.stringify({ error: 'Network offline and no cached data available' }),
          { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    };
    
    event.respondWith(apiCacheStrategy());
    return;
  }
  
  // For page navigations, use cache-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to fetch from network
          const networkResponse = await fetch(request);
          
          // If successful, update cache
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          // If network fails, try from cache
          const cachedResponse = await caches.match(request);
          
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, serve offline page
          return caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }
  
  // For all other assets, use cache-first strategy
  event.respondWith(
    (async () => {
      // Check cache first
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from network
      try {
        const networkResponse = await fetch(request);
        
        // Only cache successful GET responses
        if (request.method === 'GET' && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // If resource not critical, return empty response
        console.log('[Service Worker] Fetch failed for non-critical resource', error);
        
        // If it's an image, could return a placeholder
        if (request.destination === 'image') {
          return new Response();
        }
        
        // For other resources, throw to trigger an error in the app
        throw error;
      }
    })()
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  } else if (event.tag === 'sync-reminders') {
    event.waitUntil(syncPendingReminders());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    (async () => {
      const url = event.notification.data?.url || '/';
      const windowClients = await self.clients.matchAll({ type: 'window' });
      
      // If a window is already open, focus it
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});

// Sync pending transactions to server when online
async function syncPendingTransactions() {
  try {
    const response = await fetch('/api/sync-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync transactions');
    }
    
    // Notify clients that sync is complete
    const message = {
      type: 'SYNC_COMPLETE',
      payload: { feature: 'transactions' }
    };
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage(message));
    
    return response.json();
  } catch (error) {
    console.error('Transaction sync failed', error);
    return null;
  }
}

// Sync pending reminders to server when online
async function syncPendingReminders() {
  try {
    const response = await fetch('/api/sync-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync reminders');
    }
    
    // Notify clients that sync is complete
    const message = {
      type: 'SYNC_COMPLETE',
      payload: { feature: 'reminders' }
    };
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage(message));
    
    return response.json();
  } catch (error) {
    console.error('Reminder sync failed', error);
    return null;
  }
}