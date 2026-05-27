// ─── Cat Profile ────────────────────────────────────────────────────────────

export interface CatProfile {
  name: string
  breed: string
  birthDate: string       // YYYY-MM-DD
  weightKg: number
  neutered: boolean
  activityFactor: number  // 1.0 RER / 1.2 绝育 / 1.4 未绝育 / 1.6 活跃
}

// ─── Log Entries ─────────────────────────────────────────────────────────────

export interface MealEntry {
  type: 'meal'
  foodType: 'canned' | 'homemade'   // 德罐 | 熟自制
  weightG: number
  waterPct: number                  // 含水量 %
  foodRecordId?: number             // id of linked FoodRecord
  foodName?: string                 // auto-filled from FoodRecord
}

export interface PeeEntry {
  type: 'pee'
  amount: 'little' | 'normal' | 'lots'
  usg?: number                      // 尿比重 e.g. 1.020
  // optional: weigh litter clump instead of estimating
  // formula: urineMl = litterWeightG / 4  (10ml → 40g)
  litterWeightG?: number
}

export interface PoopEntry {
  type: 'poop'
  consistency: 'hard' | 'normal' | 'soft' | 'liquid'  // 硬 正常 软 稀
}

export interface MentalEntry {
  type: 'mental'
  status: 'good' | 'normal' | 'poor'  // 好 正常 差
}

export type EntryData = MealEntry | PeeEntry | PoopEntry | MentalEntry

export type LogEntry = EntryData & {
  id: string
  timestamp: string   // ISO string
}

// ─── Nutrition Record (saved analysis) ──────────────────────────────────────

export interface FoodRecord {
  id: number
  name: string
  protein: number
  fat: number
  ash: number
  fiber: number
  moisture: number
  phosphorus: number
  calcium: number
  canWeight: number
  catWeightKg: number
  // computed
  meTotal: number     // kcal/100g
  mePerCan: number    // kcal/can (0 if no weight)
  dm: number          // dry matter %
  dmProtein: number
  dmFat: number
  dmP: number
  pPer1000kcal: number
  caPRatio: number
  rer: number
  dailyFoodG: number
  dailyCans: number
  suppWaterMl: number
  ckdPass: boolean | null
  date: string
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type NavTab = 'log' | 'nutrition' | 'profile'
