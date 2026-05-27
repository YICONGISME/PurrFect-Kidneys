import { useState } from 'react'
import type { EntryData, MealEntry, PeeEntry, PoopEntry, MentalEntry } from '../types'

type EntryType = EntryData['type']

interface Props {
  defaultDate: string          // YYYY-MM-DD
  preselectedType?: EntryType  // if provided, skip type-picker step
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
  const [entryType, setEntryType] = useState<EntryType>(preselectedType ?? 'meal')
  const [showPicker, setShowPicker] = useState(!preselectedType)
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5))

  // meal
  const [foodType, setFoodType] = useState<MealEntry['foodType']>('canned')
  const [weightG, setWeightG] = useState('')
  const [waterPct, setWaterPct] = useState('')

  // pee
  const [peeAmount, setPeeAmount] = useState<PeeEntry['amount']>('normal')
  const [usg, setUsg] = useState('')

  // poop
  const [consistency, setConsistency] = useState<PoopEntry['consistency']>('normal')

  // mental
  const [mentalStatus, setMentalStatus] = useState<MentalEntry['status']>('normal')

  function selectType(t: EntryType) {
    setEntryType(t)
    setShowPicker(false)
  }

  function handleSubmit() {
    const timestamp = new Date(`${defaultDate}T${time}:00`).toISOString()
    let data: EntryData

    if (entryType === 'meal') {
      if (!weightG || !waterPct) return
      data = { type: 'meal', foodType, weightG: Number(weightG), waterPct: Number(waterPct) }
    } else if (entryType === 'pee') {
      data = { type: 'pee', amount: peeAmount, usg: usg ? Number(usg) : undefined }
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

            {entryType === 'meal' && (
              <>
                <label className="form-label">食物类型</label>
                <div className="btn-group">
                  <button className={`seg-btn${foodType === 'canned'   ? ' active' : ''}`} onClick={() => setFoodType('canned')}>德罐</button>
                  <button className={`seg-btn${foodType === 'homemade' ? ' active' : ''}`} onClick={() => setFoodType('homemade')}>熟自制</button>
                </div>
                <label className="form-label">
                  克重 (g)
                  <input className="form-input" type="number" min="1" value={weightG}   onChange={e => setWeightG(e.target.value)}  placeholder="例如：80" />
                </label>
                <label className="form-label">
                  含水量 (%)
                  <input className="form-input" type="number" min="0" max="100" step="0.1" value={waterPct} onChange={e => setWaterPct(e.target.value)} placeholder="例如：80" />
                </label>
              </>
            )}

            {entryType === 'pee' && (
              <>
                <label className="form-label">尿量</label>
                <div className="btn-group">
                  {(['little', 'normal', 'lots'] as const).map((v, i) => (
                    <button key={v} className={`seg-btn${peeAmount === v ? ' active' : ''}`} onClick={() => setPeeAmount(v)}>
                      {['少', '正常', '多'][i]}
                    </button>
                  ))}
                </div>
                <label className="form-label">
                  尿比重（可选）
                  <input className="form-input" type="number" step="0.001" min="1.001" max="1.080" value={usg} onChange={e => setUsg(e.target.value)} placeholder="例如：1.020" />
                </label>
              </>
            )}

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

            <button className="btn-submit" onClick={handleSubmit}>保存记录</button>
          </>
        )}
      </div>
    </div>
  )
}
