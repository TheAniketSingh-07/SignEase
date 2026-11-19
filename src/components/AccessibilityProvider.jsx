'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState('medium') // small, medium, large, xlarge
  const [highContrast, setHighContrast] = useState(false)
  const [dyslexicFont, setDyslexicFont] = useState(false)
  const [speechLanguage, setSpeechLanguage] = useState('en-US')
  const [gestureSensitivity, setGestureSensitivity] = useState(0.8)
  const [soundAlerts, setSoundAlerts] = useState(true)
  const [captionBgOpacity, setCaptionBgOpacity] = useState(90) // percentage

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('signease_accessibility_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.fontSize) setFontSize(parsed.fontSize)
        if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast)
        if (parsed.dyslexicFont !== undefined) setDyslexicFont(parsed.dyslexicFont)
        if (parsed.speechLanguage) setSpeechLanguage(parsed.speechLanguage)
        if (parsed.gestureSensitivity) setGestureSensitivity(parsed.gestureSensitivity)
        if (parsed.soundAlerts !== undefined) setSoundAlerts(parsed.soundAlerts)
        if (parsed.captionBgOpacity) setCaptionBgOpacity(parsed.captionBgOpacity)
      }
    } catch (e) {}
  }, [])

  // Apply CSS classes to body
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (highContrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }

    if (dyslexicFont) {
      document.body.classList.add('font-dyslexic')
    } else {
      document.body.classList.remove('font-dyslexic')
    }

    // Persist
    try {
      localStorage.setItem(
        'signease_accessibility_settings',
        JSON.stringify({
          fontSize,
          highContrast,
          dyslexicFont,
          speechLanguage,
          gestureSensitivity,
          soundAlerts,
          captionBgOpacity,
        })
      )
    } catch (e) {}
  }, [fontSize, highContrast, dyslexicFont, speechLanguage, gestureSensitivity, soundAlerts, captionBgOpacity])

  // Get tailwind font size class for captions
  const getCaptionFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base leading-relaxed'
      case 'large':
        return 'text-2xl leading-relaxed font-medium'
      case 'xlarge':
        return 'text-3xl leading-relaxed font-semibold'
      case 'medium':
      default:
        return 'text-lg leading-relaxed'
    }
  }

  const triggerVisualAlert = () => {
    if (typeof document === 'undefined') return
    const flash = document.createElement('div')
    flash.style.position = 'fixed'
    flash.style.inset = '0'
    flash.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
    flash.style.pointerEvents = 'none'
    flash.style.zIndex = '99999'
    flash.style.transition = 'opacity 0.4s ease-out'
    document.body.appendChild(flash)
    setTimeout(() => {
      flash.style.opacity = '0'
      setTimeout(() => flash.remove(), 400)
    }, 100)
  }

  const playNotificationSound = () => {
    if (!soundAlerts || typeof window === 'undefined') return
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.2)
    } catch (e) {}
  }

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        dyslexicFont,
        setDyslexicFont,
        speechLanguage,
        setSpeechLanguage,
        gestureSensitivity,
        setGestureSensitivity,
        soundAlerts,
        setSoundAlerts,
        captionBgOpacity,
        setCaptionBgOpacity,
        getCaptionFontSizeClass,
        triggerVisualAlert,
        playNotificationSound,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
