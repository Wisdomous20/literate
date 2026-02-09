"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface SettingsState {
  autoScrollEnabled: boolean
  autoFinishEnabled: boolean
}

interface SettingsContextType extends SettingsState {
  setAutoScrollEnabled: (enabled: boolean) => void
  setAutoFinishEnabled: (enabled: boolean) => void
}

const defaultSettings: SettingsState = {
  autoScrollEnabled: true,
  autoFinishEnabled: false,
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)

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