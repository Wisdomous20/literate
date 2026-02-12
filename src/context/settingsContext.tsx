"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface SettingsState {
  autoScrollEnabled: boolean
  autoFinishEnabled: boolean
}

interface SettingsContextType extends SettingsState {
  setAutoScrollEnabled: (enabled: boolean) => void
  setAutoFinishEnabled: (enabled: boolean) => void
}

const SETTINGS_STORAGE_KEY = "literate-settings"

const defaultSettings: SettingsState = {
  autoScrollEnabled: true,
  autoFinishEnabled: false,
}

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return defaultSettings
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    }
  } catch {}
  return defaultSettings
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(loadSettings)

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  const setAutoScrollEnabled = useCallback((v: boolean) => {
    setSettings((prev) => ({ ...prev, autoScrollEnabled: v }))
  }, [])

  const setAutoFinishEnabled = useCallback((v: boolean) => {
    setSettings((prev) => ({ ...prev, autoFinishEnabled: v }))
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setAutoScrollEnabled,
        setAutoFinishEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}