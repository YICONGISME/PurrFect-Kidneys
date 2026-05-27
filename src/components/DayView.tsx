import { useState } from 'react'
import type { LogEntry, EntryData } from '../types'
import { toDateStr } from '../store'
import { AddEntrySheet } from './AddEntrySheet'

// ─── Water balance ────────────────────────────────────────────────────────────

const PEE_ML = { little: 15, normal: 35, lots: 60 }

function calcWater(entries: LogEntry[]) {
  let intakeMl = 0, outputMl = 0
  for (const e of entries) {
    if (e.type === 'meal') intakeMl += e.weightG * e.waterPct / 100
    if (e.type === 'pee')  outputMl += PEE_ML[e.amount]
  }
  return { intakeMl, outputMl, balance: intakeMl - outputMl }
}

// ─── Quick-add buttons ────────────────────────────────────────────────────────

type EntryType = EntryData['type']

const QUICK: { type: EntryType; icon: string; label: string; cls: string }[] = [
  { type: 'meal',   icon: '🍽️', label: '吃饭', cls: 'qa-meal'   },
  { type: 'pee',    icon: '💧', label: '尿尿', cls: 'qa-pee'    },
  { type: 'poop',   icon: '💩', label: '拉屎', cls: 'qa-poop'   },
  { type: 'mental', icon: '😺', label: '精神', cls: 'qa-mental' },
]

// ─── Single entry row ─────────────────────────────────────────────────────────

function EntryRow({ entry, onDelete }: { entry: LogEntry; onDelete: () => void }) {
  const time = new Date(entry.timestamp)
    .toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

  let icon = '', title = '', detail = '', rowCls = ''

  if (entry.type === 'meal') {
    icon = '🍽️'
    title = entry.foodType === 'canned' ? '德罐' : '熟自制'
    detail = `${entry.weightG} g · 含水 ${entry.waterPct}%（≈${(entry.weightG * entry.waterPct / 100).toFixed(0)} ml）`
    rowCls = 'er-meal'
  } else if (entry.type === 'pee') {
    icon = '💧'
    title = { little: '尿少', normal: '尿正常', lots: '尿多' }[entry.amount]
    detail = entry.usg ? `USG ${entry.usg}` : ''
    rowCls = 'er-pee'
  } else if (entry.type === 'poop') {
    icon = '💩'
    title = { hard: '硬便', normal: '正常便', soft: '软便', liquid: '稀便' }[entry.consistency]
    rowCls = 'er-poop'
  } else {
    icon = '😺'
    title = { good: '精神好', normal: '精神正常', poor: '精神差' }[entry.status]
    rowCls = 'er-mental'
  }

  return (
    <div className={`entry-row ${rowCls}`}>
      <span className="er-time">{time}</span>
      <span className="er-icon">{icon}</span>
      <div className="er-body">
        <span className="er-title">{title}</span>
        {detail && <span className="er-detail">{detail}</span>}
      </div>
      <button className="er-del" onClick={onDelete}>×</button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  getDay: (dateStr: string) => LogEntry[]
  addEntry: (data: EntryData, ts: string) => void
  deleteEntry: (id: string) => void
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function DayView({ getDay, addEntry, deleteEntry }: Props) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [sheetType, setSheetType] = useState<EntryType | null>(null)

  const todayStr = toDateStr(new Date())
  const currentStr = toDateStr(current)
  const entries = getDay(currentStr)
  const { intakeMl, outputMl, balance } = calcWater(entries)

  const isToday = currentStr === todayStr

  const dateLabel = `${MONTH_NAMES[current.getMonth()]}${current.getDate()}日 ${DAY_NAMES[current.getDay()]}`

  function go(delta: number) {
    const d = new Date(current)
    d.setDate(d.getDate() + delta)
    setCurrent(d)
  }

  const hasMeals = entries.some(e => e.type === 'meal')

  return (
    <div className="day-view">

      {/* ── Date nav ── */}
      <div className="dv-nav">
        <button className="dv-nav-btn" onClick={() => go(-1)}>‹</button>
        <div className="dv-date-info">
          <span className="dv-date">{dateLabel}</span>
          {isToday && <span className="dv-today-badge">今天</span>}
        </div>
        <button className="dv-nav-btn" onClick={() => go(1)} disabled={isToday}>›</button>
      </div>

      {/* ── Quick add buttons ── */}
      <div className="dv-quick-add">
        {QUICK.map(q => (
          <button key={q.type} className={`qa-btn ${q.cls}`} onClick={() => setSheetType(q.type)}>
            <span className="qa-icon">{q.icon}</span>
            <span className="qa-label">{q.label}</span>
          </button>
        ))}
      </div>

      {/* ── Water balance ── */}
      {hasMeals && (
        <div className={`dv-water ${balance >= 0 ? 'dv-water-ok' : 'dv-water-warn'}`}>
          <span className="dv-water-title">💧 水分平衡</span>
          <div className="dv-water-stats">
            <span>摄入 <strong>{intakeMl.toFixed(0)} ml</strong></span>
            <span className="dv-water-div">·</span>
            <span>排出 <strong>{outputMl.toFixed(0)} ml</strong></span>
            <span className="dv-water-div">·</span>
            <span className={`dv-water-balance ${balance >= 0 ? 'ok' : 'warn'}`}>
              {balance >= 0 ? `+${balance.toFixed(0)}` : balance.toFixed(0)} ml
            </span>
          </div>
        </div>
      )}

      {/* ── Entry list ── */}
      <div className="dv-entries">
        {entries.length === 0 ? (
          <div className="dv-empty">
            <span className="dv-empty-icon">🐾</span>
            <p>今天还没有记录</p>
            <p className="dv-empty-hint">点击上方按钮开始记录</p>
          </div>
        ) : (
          entries.map(e => (
            <EntryRow key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
          ))
        )}
      </div>

      {/* ── Add sheet ── */}
      {sheetType && (
        <AddEntrySheet
          defaultDate={currentStr}
          preselectedType={sheetType}
          onAdd={addEntry}
          onClose={() => setSheetType(null)}
        />
      )}
    </div>
  )
}
