export interface Cat {
  id: string
  name: string
  breed: string
      birthDate: string
  weight: number // kg
  ckdStage: CKDStage
  diagnosisDate: string
  avatar?: string
  notes?: string
}

export type CKDStage = 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'unknown'

export interface WaterIntake {
  id: string
  catId: string
  date: string // ISO date string
  amountMl: number
  source: 'bowl' | 'fountain' | 'wet_food' | 'syringe' | 'other'
  notes?: string
}

export interface FoodLog {
  id: string
  catId: string
  date: string
  foodName: string
  amountGrams: number
  foodType: 'dry' | 'wet' | 'raw' | 'prescription' | 'other'
  notes?: string
}

export interface Medication {
  id: string
  catId: string
  name: string
  dosage: string
  unit: string
  frequency: string
  startDate: string
  endDate?: string
  active: boolean
  notes?: string
}

export interface MedicationLog {
  id: string
  medicationId: string
  catId: string
  givenAt: string
  given: boolean
  notes?: string
}

export interface LabResult {
  id: string
  catId: string
  date: string
  type: 'blood' | 'urine' | 'blood_pressure' | 'weight'
  // 血液指标
  bun?: number       // 尿素氮 mg/dL
  creatinine?: number // 肌酐 mg/dL
  phosphorus?: number // 磷 mg/dL
  potassium?: number  // 钾 mEq/L
  hematocrit?: number // 红细胞压积 %
  sdma?: number       // SDMA µg/dL
  // 尿液指标
  usg?: number        // 尿比重
  upcrRatio?: number  // 尿蛋白肌酐比
  // 血压
  systolicBp?: number // 收缩压 mmHg
  // 体重
  weightKg?: number
  notes?: string
  labName?: string
}

export type NavTab = 'dashboard' | 'water' | 'food' | 'medications' | 'labs' | 'settings'
