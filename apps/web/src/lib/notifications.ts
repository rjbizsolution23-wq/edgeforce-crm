'use client'

// Get the API base URL from environment or use default
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Notification types
export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: string
  title: string
  message?: string
  data: Record<string, unknown>
  read_at?: string
  action_url?: string
  created_at: string
}

export interface PushSubscription {
  id: string
  endpoint: string
  expires_at?: string
  last_used_at: string
}

// API functions - these will be proxied through Next.js to the Worker
export const getNotifications = async (userId: string, options?: { limit?: number; unread?: boolean }) => {
  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.unread) params.set('unread', 'true')

  const response = await fetch(`/api/notifications/${userId}?${params}`)
  if (!response.ok) throw new Error('Failed to get notifications')
  return response.json()
}

export const createNotification = async (notification: {
  userId: string
  type: string
  title: string
  message?: string
  data?: Record<string, unknown>
  actionUrl?: string
}) => {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  })
  if (!response.ok) throw new Error('Failed to create notification')
  return response.json()
}

export const markNotificationRead = async (notificationId: string, userId: string) => {
  const response = await fetch(`/api/notifications/${notificationId}/read?userId=${userId}`, {
    method: 'PUT',
  })
  if (!response.ok) throw new Error('Failed to mark as read')
  return response.json()
}

export const markAllNotificationsRead = async (userId: string) => {
  const response = await fetch(`/api/notifications/read-all?userId=${userId}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to mark all as read')
  return response.json()
}

export const deleteNotification = async (notificationId: string) => {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete notification')
  return response.json()
}

export const subscribeToPush = async (subscription: {
  endpoint: string
  keys_p256dh: string
  keys_auth: string
  expiresAt?: string
}) => {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!response.ok) throw new Error('Failed to subscribe to push')
  return response.json()
}

export const unsubscribeFromPush = async (endpoint: string) => {
  const response = await fetch('/api/push/unsubscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  })
  if (!response.ok) throw new Error('Failed to unsubscribe from push')
  return response.json()
}

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported')
  }

  const permission = await Notification.requestPermission()
  return permission
}

export const subscribeToWebPush = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push not supported')
    return null
  }

  const registration = await registerServiceWorker()
  if (!registration) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    ),
  })

  const result = await subscribeToPush({
    endpoint: subscription.endpoint,
    keys_p256dh: subscription.toJSON().keys?.p256dh || '',
    keys_auth: subscription.toJSON().keys?.auth || '',
  })

  return result.data
}

export const getVapidPublicKey = () => {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}