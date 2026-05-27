import { useState, useEffect, useCallback } from 'react'
import type { Cat, WaterIntake, FoodLog, Medication, MedicationLog, LabResult } from '../types'

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useCats() {
  const [cats, setCats] = useLocalStorage<Cat[]>('purrfect:cats', [])

  const addCat = useCallback((cat: Omit<Cat, 'id'>) => {
    setCats(prev => [...prev, { ...cat, id: generateId() }])
  }, [setCats])

  const updateCat = useCallback((id: string, updates: Partial<Cat>) => {
    setCats(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [setCats])

  const deleteCat = useCallback((id: string) => {
    setCats(prev => prev.filter(c => c.id !== id))
  }, [setCats])

  return { cats, addCat, updateCat, deleteCat }
}

export function useWaterIntake(catId: string) {
  const [logs, setLogs] = useLocalStorage<WaterIntake[]>('purrfect:water', [])
  const catLogs = logs.filter(l => l.catId === catId)

  const addLog = useCallback((log: Omit<WaterIntake, 'id' | 'catId'>) => {
    setLogs(prev => [...prev, { ...log, id: generateId(), catId }])
  }, [setLogs, catId])

  const deleteLog = useCallback((id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }, [setLogs])

  const todayTotal = catLogs
    .filter(l => l.date.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((sum, l) => sum + l.amountMl, 0)

  return { logs: catLogs, addLog, deleteLog, todayTotal }
}

export function useFoodLog(catId: string) {
  const [logs, setLogs] = useLocalStorage<FoodLog[]>('purrfect:food', [])
  const catLogs = logs.filter(l => l.catId === catId)

  const addLog = useCallback((log: Omit<FoodLog, 'id' | 'catId'>) => {
    setLogs(prev => [...prev, { ...log, id: generateId(), catId }])
  }, [setLogs, catId])

  const deleteLog = useCallback((id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }, [setLogs])

  return { logs: catLogs, addLog, deleteLog }
}

export function useMedications(catId: string) {
  const [meds, setMeds] = useLocalStorage<Medication[]>('purrfect:meds', [])
  const [medLogs, setMedLogs] = useLocalStorage<MedicationLog[]>('purrfect:medlogs', [])
  const catMeds = meds.filter(m => m.catId === catId)

  const addMed = useCallback((med: Omit<Medication, 'id' | 'catId'>) => {
    setMeds(prev => [...prev, { ...med, id: generateId(), catId }])
  }, [setMeds, catId])

  const updateMed = useCallback((id: string, updates: Partial<Medication>) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }, [setMeds])

  const logDose = useCallback((medicationId: string, given: boolean, notes?: string) => {
    setMedLogs(prev => [...prev, {
      id: generateId(),
      medicationId,
      catId,
      givenAt: new Date().toISOString(),
      given,
      notes,
    }])
  }, [setMedLogs, catId])

  const todayLogs = medLogs.filter(l =>
    l.catId === catId &&
    l.givenAt.startsWith(new Date().toISOString().slice(0, 10))
  )

  return { meds: catMeds, addMed, updateMed, logDose, todayLogs }
}

export function useLabResults(catId: string) {
  const [results, setResults] = useLocalStorage<LabResult[]>('purrfect:labs', [])
  const catResults = results
    .filter(r => r.catId === catId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const addResult = useCallback((result: Omit<LabResult, 'id' | 'catId'>) => {
    setResults(prev => [...prev, { ...result, id: generateId(), catId }])
  }, [setResults, catId])

  const deleteResult = useCallback((id: string) => {
    setResults(prev => prev.filter(r => r.id !== id))
  }, [setResults])

  const latest = catResults[0] ?? null

  return { results: catResults, addResult, deleteResult, latest }
}
