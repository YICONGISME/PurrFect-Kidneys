import { useState } from 'react'
import type { EntryData, MealEntry, PeeEntry, PoopEntry, MentalEntry } from '../types'
import { useFoodRecords } from '../store'

type EntryType = EntryData['type']

interface Props {
  defaultDate: string
  preselectedType?: EntryType
  onAdd: (data: EntryData, timestamp: string) => void
  onClose: () => void
}

const ENTRY_TYPES: { id: EntryType; icon: string; label: string }[] = [
  { id: 'meal',   icon: '🍽️', label: '吃饭' },
  { id: 'pee',    icon: '💧', label: '尿尿' },
  { id: 'poop',   icon: '💩', label: '拉屎' },
  { id: 'mental', icon: '😺', label: '精神' },
]

export function AddEntrySheet({ defaultDate, preselectedType, onAdd, onClose }: Props) {
  const { records: foodRecords } = useFoodRecords()

  const [entryType, setEntryType] = useState<EntryType>(preselectedType ?? 'meal')
  const [showPicker, setShowPicker] = useState(!preselectedType)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))

  // ── meal ──────────────────────────────────────────────────────────────────
  // mealMode: 'record' = select from saved food records; 'manual' = free input
  const [mealMode, setMealMode] = useState<'record' | 'manual'>(
    foodRecords.length > 0 ? 'record' : 'manual'
  )
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(
    foodRecords.length > 0 ? foodRecords[0].id : null
  )
  const [weightG, setWeightG]   = useState('')
  const [manualFoodType, setManualFoodType] = useState<MealEntry['foodType']>('canned')
  const [manualWaterPct, setManualWaterPct] = useState('')

  // ── pee ───────────────────────────────────────────────────────────────────
  // peeMode: 'amount' = pick 少/正常/多; 'litter' = weigh clump
  const [peeMode, setPeeMode] = useState<'amount' | 'litter'>('amount')
  const [peeAmount, setPeeAmount] = useState<PeeEntry['amount']>('normal')
  const [litterWeightG, setLitterWeightG] = useState('')
  const [usg, setUsg] = useState('')

  // ── poop ──────────────────────────────────────────────────────────────────
  const [consistency, setConsistency] = useState<PoopEntry['consistency']>('normal')

  // ── mental ────────────────────────────────────────────────────────────────
  const [mentalStatus, setMentalStatus] = useState<MentalEntry['status']>('normal')

  function selectType(t: EntryType) {
    setEntryType(t)
    setShowPicker(false)
  }

  // derived: selected food record
  const selectedRecord = foodRecords.find(r => r.id === selectedRecordId) ?? null

  // derived: litter → urine conversion
  const litterNum   = parseFloat(litterWeightG) || 0
  const calculatedUrineMl = litterNum > 0 ? litterNum / 4 : 0

  function canSubmit(): boolean {
    if (entryType === 'meal') {
      if (!weightG || isNaN(Number(weightG))) return false
      if (mealMode === 'record') return selectedRecord !== null
      return !!manualWaterPct
    }
    if (entryType === 'pee' && peeMode === 'litter') {
      return litterNum > 0
    }
    return true
  }

  function handleSubmit() {
    if (!canSubmit()) return
    const timestamp = new Date(`${defaultDate}T${time}:00`).toISOString()
    let data: EntryData

    if (entryType === 'meal') {
      if (mealMode === 'record' && selectedRecord) {
        data = {
          type: 'meal',
          foodType: 'canned',
          weightG: Number(weightG),
          waterPct: selectedRecord.moisture,
          foodRecordId: selectedRecord.id,
          foodName: selectedRecord.name,
        }
      } else {
        data = {
          type: 'meal',
          foodType: manualFoodType,
          weightG: Number(weightG),
          waterPct: Number(manualWaterPct),
        }
      }
    } else if (entryType === 'pee') {
      data = {
        type: 'pee',
        amount: peeMode === 'litter' ? 'normal' : peeAmount,
        usg: usg ? Number(usg) : undefined,
        litterWeightG: peeMode === 'litter' ? litterNum : undefined,
      }
    } else if (entryType === 'poop') {
      data = { type: 'poop', consistency }
    } else {
      data = { type: 'mental', status: mentalStatus }
    }

    onAdd(data, timestamp)
    onClose()
  }

  const meta = ENTRY_TYPES.find(t => t.id === entryType)!

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        {showPicker ? (
          <>
            <h3 className="sheet-title">选择记录类型</h3>
            <div className="type-grid">
              {ENTRY_TYPES.map(t => (
                <button key={t.id} className="type-btn" onClick={() => selectType(t.id)}>
                  <span className="type-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="sheet-header">
              <button className="sheet-back" onClick={() => setShowPicker(true)}>← 返回</button>
              <h3 className="sheet-title">{meta.icon} {meta.label}</h3>
            </div>

            <label className="form-label">
              时间
              <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </label>

            {/* ── 吃饭 ── */}
            {entryType === 'meal' && (
              <>
                {/* Mode toggle */}
                <label className="form-label">食物来源</label>
                <div className="btn-group">
                  <button
                    className={`seg-btn${mealMode === 'record' ? ' active' : ''}`}
                    onClick={() => setMealMode('record')}
                    disabled={foodRecords.length === 0}
                  >
                    从营养记录选
                  </button>
                  <button
                    className={`seg-btn${mealMode === 'manual' ? ' active' : ''}`}
                    onClick={() => setMealMode('manual')}
                  >
                    手动输入
                  </button>
                </div>

                {mealMode === 'record' ? (
                  <>
                    {foodRecords.length === 0 ? (
                      <p className="sheet-hint">请先在「营养」模块保存德罐记录</p>
                    ) : (
                      <>
                        <label className="form-label">选择德罐</label>
                        <div className="food-record-list">
                          {foodRecords.map(r => (
                            <button
                              key={r.id}
                              className={`food-record-item${selectedRecordId === r.id ? ' selected' : ''}`}
                              onClick={() => setSelectedRecordId(r.id)}
                            >
                              <span className="fri-name">{r.name}</span>
                              <span className="fri-meta">含水 {r.moisture}% · {r.meTotal.toFixed(1)} kcal/100g</span>
                            </button>
                          ))}
                        </div>
                        {selectedRecord && (
                          <div className="auto-fill-tip">
                            ✓ 含水量已自动填充：{selectedRecord.moisture}%
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label className="form-label">食物类型</label>
                    <div className="btn-group">
                      <button className={`seg-btn${manualFoodType === 'canned'   ? ' active' : ''}`} onClick={() => setManualFoodType('canned')}>德罐</button>
                      <button className={`seg-btn${manualFoodType === 'homemade' ? ' active' : ''}`} onClick={() => setManualFoodType('homemade')}>熟自制</button>
                    </div>
                    <label className="form-label">
                      含水量 (%)
                      <input
                        className="form-input" type="number" min="0" max="100" step="0.1"
                        value={manualWaterPct} onChange={e => setManualWaterPct(e.target.value)}
                        placeholder="例如：80"
                      />
                    </label>
                  </>
                )}

                <label className="form-label">
                  喂食克重 (g)
                  <input
                    className="form-input" type="number" min="1"
                    value={weightG} onChange={e => setWeightG(e.target.value)}
                    placeholder="例如：80"
                  />
                </label>
                {weightG && (mealMode === 'record' ? selectedRecord : manualWaterPct) && (
                  <div className="calc-preview">
                    💧 摄水约 {(
                      Number(weightG) * (mealMode === 'record' ? selectedRecord!.moisture : Number(manualWaterPct)) / 100
                    ).toFixed(0)} ml
                  </div>
                )}
              </>
            )}

            {/* ── 尿尿 ── */}
            {entryType === 'pee' && (
              <>
                <label className="form-label">记录方式</label>
                <div className="btn-group">
                  <button className={`seg-btn${peeMode === 'amount' ? ' active' : ''}`} onClick={() => setPeeMode('amount')}>选择尿量</button>
                  <button className={`seg-btn${peeMode === 'litter' ? ' active' : ''}`} onClick={() => setPeeMode('litter')}>称猫砂团重</button>
                </div>

                {peeMode === 'amount' ? (
                  <>
                    <label className="form-label">尿量</label>
                    <div className="btn-group">
                      {(['little', 'normal', 'lots'] as const).map((v, i) => (
                        <button key={v} className={`seg-btn${peeAmount === v ? ' active' : ''}`} onClick={() => setPeeAmount(v)}>
                          {['少', '正常', '多'][i]}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="form-label">
                      尿团重量 (g)
                      <input
                        className="form-input" type="number" min="1" step="0.1"
                        value={litterWeightG} onChange={e => setLitterWeightG(e.target.value)}
                        placeholder="例如：120"
                      />
                    </label>
                    {calculatedUrineMl > 0 && (
                      <div className="calc-preview">
                        💧 折算尿量约 {calculatedUrineMl.toFixed(1)} ml
                        <span className="calc-formula">（{litterWeightG}g ÷ 4 = {calculatedUrineMl.toFixed(1)} ml）</span>
                      </div>
                    )}
                  </>
                )}

                <label className="form-label">
                  尿比重（可选）
                  <input
                    className="form-input" type="number" step="0.001" min="1.001" max="1.080"
                    value={usg} onChange={e => setUsg(e.target.value)}
                    placeholder="例如：1.020"
                  />
                </label>
              </>
            )}

            {/* ── 拉屎 ── */}
            {entryType === 'poop' && (
              <>
                <label className="form-label">软硬程度</label>
                <div className="btn-group">
                  {(['hard', 'normal', 'soft', 'liquid'] as const).map((v, i) => (
                    <button key={v} className={`seg-btn${consistency === v ? ' active' : ''}`} onClick={() => setConsistency(v)}>
                      {['硬', '正常', '软', '稀'][i]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── 精神 ── */}
            {entryType === 'mental' && (
              <>
                <label className="form-label">精神状态</label>
                <div className="btn-group">
                  {(['good', 'normal', 'poor'] as const).map((v, i) => (
                    <button key={v} className={`seg-btn${mentalStatus === v ? ' active' : ''}`} onClick={() => setMentalStatus(v)}>
                      {['好', '正常', '差'][i]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button className="btn-submit" onClick={handleSubmit} disabled={!canSubmit()}>
              保存记录
            </button>
          </>
        )}
      </div>
    </div>
  )
}
