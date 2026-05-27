import { useState } from 'react'
import type { LogEntry, EntryData } from '../types'
import { getWeekStart, getWeekDays, toDateStr } from '../store'
import { AddEntrySheet } from './AddEntrySheet'

// ─── helpers ──────────────────────────────────────────────────────────────────

const PEE_ML = { little: 15, normal: 35, lots: 60 }

function peeMl(e: LogEntry & { type: 'pee' }) {
  return e.litterWeightG && e.litterWeightG > 0 ? e.litterWeightG / 4 : PEE_ML[e.amount]
}

function calcWater(entries: LogEntry[]) {
  let intakeMl = 0, outputMl = 0
  for (const e of entries) {
    if (e.type === 'meal') intakeMl += e.weightG * e.waterPct / 100
    if (e.type === 'pee')  outputMl += peeMl(e)
  }
  return {
    intakeMl: parseFloat(intakeMl.toFixed(1)),
    outputMl: parseFloat(outputMl.toFixed(1)),
    balance:  parseFloat((intakeMl - outputMl).toFixed(1)),
  }
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// ─── Compact entry card ───────────────────────────────────────────────────────

function CompactCard({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  const time = new Date(entry.timestamp)
    .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

  let icon = '', line1 = '', line2 = '', cls = ''

  if (entry.type === 'meal') {
    icon = '🍽️'; cls = 'cc-meal'
    line1 = entry.foodName ?? (entry.foodType === 'canned' ? '德罐' : '自制')
    line2 = `${entry.weightG}g/${entry.waterPct}%`
  } else if (entry.type === 'pee') {
    icon = '💧'; cls = 'cc-pee'
    line1 = `${peeMl(entry)}ml`
    line2 = entry.usg ? `${entry.usg}` : ''
  } else if (entry.type === 'poop') {
    icon = '💩'; cls = 'cc-poop'
    line1 = { hard: '硬', normal: '正常', soft: '软', liquid: '稀' }[entry.consistency]
  } else {
    icon = '😺'; cls = 'cc-mental'
    line1 = { good: '好', normal: '正常', poor: '差' }[entry.status]
  }

  return (
    <div className={`compact-card ${cls}`}>
      <button className="cc-del" onClick={onDelete}>×</button>
      <span className="cc-time">{time}</span>
      <span className="cc-icon">{icon}</span>
      <span className="cc-line1">{line1}</span>
      {line2 && <span className="cc-line2">{line2}</span>}
    </div>
  )
}

// ─── Quick-add buttons ────────────────────────────────────────────────────────

type EntryType = EntryData['type']

const ACTIONS: { type: EntryType; icon: string; label: string; cls: string }[] = [
  { type: 'meal',   icon: '🍽️', label: '吃饭', cls: 'act-meal'   },
  { type: 'pee',    icon: '💧', label: '尿尿', cls: 'act-pee'    },
  { type: 'poop',   icon: '💩', label: '拉屎', cls: 'act-poop'   },
  { type: 'mental', icon: '😺', label: '精神', cls: 'act-mental' },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  getDay:      (dateStr: string) => LogEntry[]
  addEntry:    (data: EntryData, ts: string) => void
  deleteEntry: (id: string) => void
}

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export function WeekLogView({ getDay, addEntry, deleteEntry }: Props) {
  const todayStr = toDateStr(new Date())

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sheetType, setSheetType] = useState<EntryType | null>(null)

  const days = getWeekDays(weekStart)

  const [s, e] = [days[0], days[6]]
  const weekLabel = `${MONTH_NAMES[s.getMonth()]}${s.getDate()}日–${e.getMonth()+1}月${e.getDate()}日`

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d)
    // select first day of new week
    setSelectedDate(toDateStr(d))
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d)
    // if new week contains today, select today; otherwise select first day
    const newDays = getWeekDays(d)
    const hasToday = newDays.some(nd => toDateStr(nd) === todayStr)
    setSelectedDate(hasToday ? todayStr : toDateStr(newDays[0]))
  }

  const selDate = new Date(selectedDate)
  const selLabel = `${MONTH_NAMES[selDate.getMonth()]}${selDate.getDate()}日 ${DAY_NAMES[selDate.getDay()]}`

  return (
    <div className="wlv">

      {/* ── Week nav ── */}
      <div className="wlv-nav">
        <button className="wlv-nav-btn" onClick={prevWeek}>‹</button>
        <span className="wlv-week-label">{weekLabel}</span>
        <button className="wlv-nav-btn" onClick={nextWeek}>›</button>
      </div>

      {/* ── Grid (headers sticky + entries scroll) ── */}
      <div className="wlv-scroll">
        <div className="wlv-grid">
          {days.map(d => {
            const ds      = toDateStr(d)
            const entries = getDay(ds)
            const isToday = ds === todayStr
            const isSel   = ds === selectedDate
            const { intakeMl, outputMl, balance } = calcWater(entries)
            const hasWater = intakeMl > 0 || outputMl > 0

            return (
              <div key={ds} className={`wlv-col${isSel ? ' wlv-selected' : ''}${isToday ? ' wlv-today' : ''}`}>
                {/* sticky column header */}
                <button className="wlv-col-head" onClick={() => setSelectedDate(ds)}>
                  <span className="wlv-day-name">{DAY_NAMES[d.getDay()]}</span>
                  <span className="wlv-day-date">{d.getMonth()+1}/{d.getDate()}</span>
                  {isSel && <span className="wlv-sel-dot" />}
                </button>

                {/* entries in chronological order */}
                <div className="wlv-entries">
                  {entries.map(entry => (
                    <CompactCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />
                  ))}
                </div>

                {/* daily water balance */}
                {hasWater && (
                  <div className={`wlv-water-bal ${balance >= 0 ? 'wb-ok' : 'wb-warn'}`}>
                    <span className="wb-in">摄 {intakeMl}ml</span>
                    <span className="wb-out">排 {outputMl}ml</span>
                    <span className="wb-bal">{balance >= 0 ? '+' : ''}{balance}ml</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="wlv-action-bar">
        <div className="wlv-action-label">记录到 {selLabel}</div>
        <div className="wlv-actions">
          {ACTIONS.map(a => (
            <button key={a.type} className={`wlv-act-btn ${a.cls}`} onClick={() => setSheetType(a.type)}>
              <span className="wlv-act-icon">{a.icon}</span>
              <span className="wlv-act-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {sheetType && (
        <AddEntrySheet
          defaultDate={selectedDate}
          preselectedType={sheetType}
          onAdd={addEntry}
          onClose={() => setSheetType(null)}
        />
      )}
    </div>
  )
}
