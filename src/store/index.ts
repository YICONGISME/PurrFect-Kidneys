import { useState, useEffect, useCallback } from 'react'
import type { CatProfile, LogEntry, EntryData, FoodRecord } from '../types'

// ─── Generic localStorage hook ───────────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? JSON.parse(s) : initial
    } catch { return initial }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue] as const
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Cat Profile ─────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: CatProfile = {
  name: '',
  breed: '',
  birthDate: '',
  weightKg: 4.2,
  neutered: true,
  activityFactor: 1.2,
}

export function useCatProfile() {
  const [profile, setProfile] = useLocalStorage<CatProfile>('pk:profile', DEFAULT_PROFILE)

  // one-time migration: old default was 4, update to 4.2
  useEffect(() => {
    if (profile.weightKg === 4) {
      setProfile(p => ({ ...p, weightKg: 4.2 }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rer = 30 * profile.weightKg + 70
  const der = rer * profile.activityFactor
  const dailyWaterMl = profile.weightKg * 45
  return { profile, setProfile, rer, der, dailyWaterMl }
}

// ─── Log Entries ─────────────────────────────────────────────────────────────

export function useLogEntries() {
  const [entries, setEntries] = useLocalStorage<LogEntry[]>('pk:log', [])

  const addEntry = useCallback((data: EntryData, timestamp?: string) => {
    const entry: LogEntry = { ...data, id: uid(), timestamp: timestamp ?? new Date().toISOString() }
    setEntries(prev => [...prev, entry])
  }, [setEntries])

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [setEntries])

  // Returns entries for a specific calendar day (YYYY-MM-DD), sorted by time
  const getDay = useCallback((dateStr: string) => {
    return entries
      .filter(e => e.timestamp.slice(0, 10) === dateStr)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [entries])

  return { entries, addEntry, deleteEntry, getDay }
}

// ─── Food Records (nutrition analysis) ───────────────────────────────────────

export function useFoodRecords() {
  const [records, setRecords] = useLocalStorage<FoodRecord[]>('pk:foods', [])

  const addRecord = useCallback((r: FoodRecord) => {
    setRecords(prev => [r, ...prev])
  }, [setRecords])

  const deleteRecord = useCallback((id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id))
  }, [setRecords])

  return { records, addRecord, deleteRecord }
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()                    // 0=Sun
  const diff = day === 0 ? -6 : 1 - day    // shift to Monday
  d.setDate(d.getDate() + diff)
  return d
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}
