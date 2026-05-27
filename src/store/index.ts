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
    if (profile.weightKg === 4 || profile.weightKg === 4.3) {
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

function buildRecord(
  id: number, name: string,
  protein: number, fat: number, ash: number, fiber: number,
  moisture: number, phosphorus: number, calcium: number,
  canWeight = 200, catWeightKg = 4.2,
): FoodRecord {
  const nfe      = Math.max(0, 100 - protein - fat - ash - fiber - moisture)
  const meTotal  = protein * 3.5 + fat * 8.5 + nfe * 3.5
  const mePerCan = canWeight > 0 ? meTotal * canWeight / 100 : 0
  const dm       = 100 - moisture
  const toDM     = (v: number) => dm > 0 ? v / dm * 100 : 0
  const dmP      = toDM(phosphorus)
  const pPer1000kcal = meTotal > 0 ? phosphorus * 1000 / meTotal * 1000 : 0
  const ckdPass  = phosphorus > 0 ? dmP <= 1.0 && pPer1000kcal <= 2000 : null
  const rer      = 30 * catWeightKg + 70
  const dailyFoodG = meTotal > 0 ? rer / meTotal * 100 : 0
  const foodWater  = moisture / 100 * dailyFoodG
  return {
    id, name, protein, fat, ash, fiber, moisture, phosphorus, calcium,
    canWeight, catWeightKg,
    meTotal, mePerCan, dm,
    dmProtein: toDM(protein), dmFat: toDM(fat), dmP,
    pPer1000kcal, caPRatio: phosphorus > 0 ? calcium / phosphorus : 0,
    rer, dailyFoodG,
    dailyCans: canWeight > 0 && dailyFoodG > 0 ? dailyFoodG / canWeight : 0,
    suppWaterMl: Math.max(0, catWeightKg * 45 - foodWater),
    ckdPass, date: '预设',
  }
}

const DEFAULT_FOODS: FoodRecord[] = [
  buildRecord(1, 'catz 3号',  8.2, 3.2, 3.6, 1.2, 86.4, 0.11, 0.14),
  buildRecord(2, 'catz 15号', 8.2, 3.2, 3.8, 1.2, 86.4, 0.11, 0.14),
  buildRecord(3, '德金猪',   14.3, 5.5, 2.6, 0.4, 77.0, 0.20, 0.27),
]

export function useFoodRecords() {
  const [records, setRecords] = useLocalStorage<FoodRecord[]>('pk:foods', DEFAULT_FOODS)

  // seed missing defaults for users who already had an empty records list
  useEffect(() => {
    const missing = DEFAULT_FOODS.filter(df => !records.some(r => r.name === df.name))
    if (missing.length > 0) setRecords(prev => [...missing, ...prev])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
