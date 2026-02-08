const SW_PATH = '/sw.js';
const FLOWBILLS_CACHE_PREFIX = 'flowbills-';
const ACTIVE_CACHE_NAME = 'flowbills-v10';

export async function cleanupFlowBillsCaches(): Promise<void> {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  const staleCaches = cacheNames.filter(
    (name) => name.startsWith(FLOWBILLS_CACHE_PREFIX) && name !== ACTIVE_CACHE_NAME
  );

  await Promise.all(staleCaches.map((name) => caches.delete(name)));
}

export async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  await cleanupFlowBillsCaches();
  await navigator.serviceWorker.register(SW_PATH, {
    scope: '/',
    updateViaCache: 'none',
  });
}
