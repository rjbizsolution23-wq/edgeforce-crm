'use client'

import { useEffect } from 'react'

export function usePWA() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }

    // Handle beforeinstallprompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent

      // Show custom install button in your UI
      window.dispatchEvent(new CustomEvent('pwa-install-available', { detail: deferredPrompt }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle app installed
    const handleAppInstalled = () => {
      window.dispatchEvent(new CustomEvent('pwa-installed'))
      deferredPrompt = null
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
}

// Type for the install prompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export async function installPWA(): Promise<boolean> {
  const event = window.dispatchEvent(
    new CustomEvent('pwa-install-available')
  )

  // Check for deferred prompt
  const deferredPrompt = (window as any).deferredPrompt as BeforeInstallPromptEvent | undefined

  if (deferredPrompt) {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    return outcome === 'accepted'
  }

  return false
}

// Check if running as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// Check online status
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}