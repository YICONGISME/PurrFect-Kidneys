import { useState } from 'react'
import type { EntryData, MealEntry, PoopEntry } from '../types'
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
  const [probiotics, setProbiotics] = useState(false)
  const [fishOil, setFishOil]       = useState(false)

  // ── pee ───────────────────────────────────────────────────────────────────
  const [litterWeightG, setLitterWeightG] = useState('')
  const [usg, setUsg] = useState('')

  // ── poop ──────────────────────────────────────────────────────────────────
  const [consistency, setConsistency] = useState<PoopEntry['consistency']>('normal')

  // ── mental ────────────────────────────────────────────────────────────────
  const [playedWand, setPlayedWand] = useState(false)
  const [didParkour, setDidParkour] = useState(false)
  const [otherNote, setOtherNote]   = useState('')

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
    if (entryType === 'pee') return litterNum > 0
    return true
  }

  function handleSubmit() {
    if (!canSubmit()) return
    const timestamp = new Date(`${defaultDate}T${time}:00`).toISOString()
    let data: EntryData

    if (entryType === 'meal') {
      const extras = { probiotics: probiotics || undefined, fishOil: fishOil || undefined }
      if (mealMode === 'record' && selectedRecord) {
        data = {
          type: 'meal',
          foodType: 'canned',
          weightG: Number(weightG),
          waterPct: selectedRecord.moisture,
          foodRecordId: selectedRecord.id,
          foodName: selectedRecord.name,
          ...extras,
        }
      } else {
        data = {
          type: 'meal',
          foodType: manualFoodType,
          weightG: Number(weightG),
          waterPct: Number(manualWaterPct),
          ...extras,
        }
      }
    } else if (entryType === 'pee') {
      data = {
        type: 'pee',
        amount: 'normal',
        litterWeightG: litterNum,
        usg: usg ? Number(usg) : undefined,
      }
    } else if (entryType === 'poop') {
      data = { type: 'poop', consistency }
    } else {
      data = { type: 'mental', playedWand, didParkour, otherNote: otherNote.trim() || undefined }
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

                <label className="form-label">是否喂益生菌</label>
                <div className="btn-group">
                  <button className={`seg-btn${probiotics  ? ' active' : ''}`} onClick={() => setProbiotics(true)}>✅ 喂了</button>
                  <button className={`seg-btn${!probiotics ? ' active' : ''}`} onClick={() => setProbiotics(false)}>❌ 没喂</button>
                </div>

                <label className="form-label">是否喂鱼油</label>
                <div className="btn-group">
                  <button className={`seg-btn${fishOil  ? ' active' : ''}`} onClick={() => setFishOil(true)}>✅ 喂了</button>
                  <button className={`seg-btn${!fishOil ? ' active' : ''}`} onClick={() => setFishOil(false)}>❌ 没喂</button>
                </div>
              </>
            )}

            {/* ── 尿尿 ── */}
            {entryType === 'pee' && (
              <>
                <label className="form-label">
                  猫砂尿团重量 (g)
                  <input
                    className="form-input" type="number" min="1" step="0.1"
                    value={litterWeightG} onChange={e => setLitterWeightG(e.target.value)}
                    placeholder="例如：120"
                    autoFocus
                  />
                </label>
                {calculatedUrineMl > 0 && (
                  <div className="pee-result">
                    <span className="pee-result-label">折算尿量</span>
                    <span className="pee-result-value">{calculatedUrineMl} ml</span>
                    <span className="pee-result-formula">{litterWeightG} g ÷ 4</span>
                  </div>
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
                <label className="form-label">是否玩逗猫棒</label>
                <div className="btn-group">
                  <button className={`seg-btn${playedWand  ? ' active' : ''}`} onClick={() => setPlayedWand(true)}>✅ 玩了</button>
                  <button className={`seg-btn${!playedWand ? ' active' : ''}`} onClick={() => setPlayedWand(false)}>❌ 没玩</button>
                </div>
                <label className="form-label">是否跑酷</label>
                <div className="btn-group">
                  <button className={`seg-btn${didParkour  ? ' active' : ''}`} onClick={() => setDidParkour(true)}>✅ 跑了</button>
                  <button className={`seg-btn${!didParkour ? ' active' : ''}`} onClick={() => setDidParkour(false)}>❌ 没跑</button>
                </div>
                <label className="form-label">
                  其他异常（可选）
                  <input
                    className="form-input" type="text"
                    value={otherNote} onChange={e => setOtherNote(e.target.value)}
                    placeholder="例如：呕吐、食欲差..."
                  />
                </label>
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
