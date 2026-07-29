'use client';

import { useEffect, useState } from 'react';

// Helper to convert base64 VAPID key to Uint8Array for subscribe options
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      
      // If we are already subscribed, let's keep the backend in sync
      if (subscription) {
        await sendSubscriptionToBackend(subscription);
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      if (!response.ok) {
        console.warn('Failed to send subscription details to backend');
      }
    } catch (err) {
      console.error('Error sending subscription to backend:', err);
    }
  };

  const handleSubscribe = async () => {
    try {
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== 'granted') {
        console.log('Notification permission denied by user');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not found in env configuration');
        return;
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      await sendSubscriptionToBackend(subscription);
      setIsSubscribed(true);
      console.log('Successfully subscribed user to push notifications');
    } catch (err) {
      console.error('Failed to subscribe user:', err);
    }
  };

  // Automatically request/subscribe if supported and permission is default
  useEffect(() => {
    if (isSupported && permission === 'default') {
      // Delay slightly to not interrupt initial page load
      const timer = setTimeout(() => {
        handleSubscribe();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  // Periodic Background Sync Registration
  useEffect(() => {
    if (isSupported && isSubscribed) {
      registerPeriodicSync();
    }
  }, [isSupported, isSubscribed]);

  const registerPeriodicSync = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in registration) {
        const status = await (navigator as any).permissions.query({
          name: 'periodic-background-sync',
        });
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('check-new-items', {
            minInterval: 5 * 60 * 1000, // 5 minutes
          });
          console.log('Registered periodic background sync: check-new-items');
        } else {
          console.log('Periodic background sync permission not granted');
        }
      }
    } catch (err) {
      console.warn('Periodic Background Sync registration failed:', err);
    }
  };

  return null; // Invisible component
}
