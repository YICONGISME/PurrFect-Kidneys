import { useState } from 'react'
import type { LogEntry } from '../types'
import { getWeekStart, getWeekDays, toDateStr } from '../store'
import { AddEntrySheet } from './AddEntrySheet'
import type { EntryData } from '../types'

// ─── Water balance ────────────────────────────────────────────────────────────

const PEE_ML = { little: 15, normal: 35, lots: 60 }

function calcWater(entries: LogEntry[]) {
  let intakeMl = 0
  let outputMl = 0
  for (const e of entries) {
    if (e.type === 'meal') intakeMl += e.weightG * e.waterPct / 100
    if (e.type === 'pee') outputMl += PEE_ML[e.amount]
  }
  return { intakeMl, outputMl, balance: intakeMl - outputMl }
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  let icon = ''
  let line1 = ''
  let line2 = ''
  let colorVar = ''

  if (entry.type === 'meal') {
    icon = '🍽️'
    line1 = entry.foodType === 'canned' ? '德罐' : '熟自制'
    line2 = `${entry.weightG}g / ${entry.waterPct}%`
    colorVar = 'var(--meal-bg)'
  } else if (entry.type === 'pee') {
    icon = '💧'
    line1 = { little: '尿少', normal: '尿正常', lots: '尿多' }[entry.amount]
    line2 = entry.usg ? `USG ${entry.usg}` : ''
    colorVar = 'var(--pee-bg)'
  } else if (entry.type === 'poop') {
    icon = '💩'
    line1 = { hard: '硬便', normal: '正常便', soft: '软便', liquid: '稀便' }[entry.consistency]
    colorVar = 'var(--poop-bg)'
  } else {
    icon = '😺'
    line1 = { good: '精神好', normal: '精神正常', poor: '精神差' }[entry.status]
    colorVar = 'var(--mental-bg)'
  }

  return (
    <div className="entry-card" style={{ background: colorVar }}>
      <div className="entry-time">{time}</div>
      <div className="entry-icon">{icon}</div>
      <div className="entry-line1">{line1}</div>
      {line2 && <div className="entry-line2">{line2}</div>}
      <button className="entry-del" onClick={onDelete} title="删除">×</button>
    </div>
  )
}

// ─── Day column ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function DayColumn({
  date, isToday, entries, onAdd, onDelete,
}: {
  date: Date
  isToday: boolean
  entries: LogEntry[]
  onAdd: (date: Date) => void
  onDelete: (id: string) => void
}) {
  const { intakeMl, outputMl, balance } = calcWater(entries)
  const dayIdx = (date.getDay() + 6) % 7  // 0=Mon…6=Sun
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`
  const hasWater = intakeMl > 0 || outputMl > 0

  return (
    <div className={`day-col${isToday ? ' today' : ''}`}>
      <div className="day-header">
        <span className="day-name">{DAY_NAMES[dayIdx]}</span>
        <span className="day-date">{dateLabel}</span>
      </div>

      <div className="day-entries">
        {entries.length === 0 && <div className="day-empty">—</div>}
        {entries.map(e => (
          <EntryCard key={e.id} entry={e} onDelete={() => onDelete(e.id)} />
        ))}
      </div>

      <button className="day-add-btn" onClick={() => onAdd(date)}>＋</button>

      {hasWater && (
        <div className={`water-summary${balance >= 0 ? ' ok' : ' warn'}`}>
          <div className="ws-row"><span>摄入</span><span>{intakeMl.toFixed(0)} ml</span></div>
          <div className="ws-row"><span>排出</span><span>{outputMl.toFixed(0)} ml</span></div>
          <div className="ws-balance">{balance >= 0 ? `+${balance.toFixed(0)}` : balance.toFixed(0)} ml</div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  getDay: (dateStr: string) => LogEntry[]
  addEntry: (data: EntryData, ts: string) => void
  deleteEntry: (id: string) => void
}

export function WeekTable({ getDay, addEntry, deleteEntry }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const days = getWeekDays(weekStart)
  const todayStr = toDateStr(new Date())

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const weekLabel = (() => {
    const s = days[0]
    const e = days[6]
    return `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`
  })()

  return (
    <div className="week-wrap">
      <div className="week-nav">
        <button className="week-nav-btn" onClick={prevWeek}>‹</button>
        <span className="week-label">{weekLabel}</span>
        <button className="week-nav-btn" onClick={nextWeek}>›</button>
      </div>

      <div className="week-scroll">
        <div className="week-grid">
          {days.map(d => {
            const ds = toDateStr(d)
            return (
              <DayColumn
                key={ds}
                date={d}
                isToday={ds === todayStr}
                entries={getDay(ds)}
                onAdd={date => setSheetDate(toDateStr(date))}
                onDelete={deleteEntry}
              />
            )
          })}
        </div>
      </div>

      {sheetDate && (
        <AddEntrySheet
          defaultDate={sheetDate}
          onAdd={addEntry}
          onClose={() => setSheetDate(null)}
        />
      )}
    </div>
  )
}
