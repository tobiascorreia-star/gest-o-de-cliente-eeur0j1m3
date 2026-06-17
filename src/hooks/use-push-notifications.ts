import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'

// Public VAPID key - generate with: npx web-push generate-vapid-keys
// Set this in your .env as VITE_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      console.warn('Push notifications not supported or VAPID key missing')
      return false
    }

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission as PushPermission)

      if (permission !== 'granted') {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const user = pb.authStore.model
      if (user) {
        await pb.collection('push_subscriptions').create({
          user: user.id,
          subscription: JSON.stringify(subscription.toJSON()),
          user_agent: navigator.userAgent,
        }).catch(() => {
          // Collection may not exist yet - save to localStorage as fallback
          localStorage.setItem('push_subscription', JSON.stringify(subscription.toJSON()))
        })
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        const user = pb.authStore.model
        if (user) {
          const subs = await pb.collection('push_subscriptions').getFullList({
            filter: `user = "${user.id}"`,
          }).catch(() => [])
          for (const s of subs) {
            await pb.collection('push_subscriptions').delete(s.id).catch(() => {})
          }
        }
        localStorage.removeItem('push_subscription')
      }
      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe()
    }
    return subscribe()
  }, [isSubscribed, subscribe, unsubscribe])

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    toggle,
  }
}
