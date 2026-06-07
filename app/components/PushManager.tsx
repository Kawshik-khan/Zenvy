'use client';

import { useEffect, useRef } from 'react';

export default function PushManager() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    async function registerServiceWorker() {
      // Check if push is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported in this browser');
        return;
      }

      try {
        // Register service worker
        let registration: ServiceWorkerRegistration;
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration.scope);
        } catch (swErr) {
          console.debug('Service Worker registration failed (this is normal in dev):', swErr);
          return;
        }

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        // Check existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          // Already subscribed — send to server in case it's a new session
          await sendSubscriptionToServer(existingSubscription);
          return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return;
        }

        // Subscribe to push
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });

        await sendSubscriptionToServer(subscription);
      } catch (err) {
        // Silently ignore push registration failures (normal in dev/test environments)
      }
    }

    registerServiceWorker();
  }, []);

  return null; // This component renders nothing — it just registers
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to save push subscription');
    }
  } catch (err) {
    console.error('Error sending subscription to server:', err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
