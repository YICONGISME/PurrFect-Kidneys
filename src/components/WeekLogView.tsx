import { useState, useEffect } from 'react'
import type { LogEntry, EntryData } from '../types'
import { toDateStr } from '../store'
import { AddEntrySheet } from './AddEntrySheet'

// ─── helpers ──────────────────────────────────────────────────────────────────

const PEE_ML = { little: 15, normal: 35, lots: 60 }

function peeMl(e: LogEntry & { type: 'pee' }) {
  return e.litterWeightG && e.litterWeightG > 0 ? e.litterWeightG / 4 : PEE_ML[e.amount]
}

// 合并水分：从昨天 07:00 到今天 24:00
function calcCombinedWater(allEntries: LogEntry[], today: Date) {
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  // 窗口起点：昨天 07:00:00
  const windowStart = new Date(yesterday)
  windowStart.setHours(7, 0, 0, 0)
  // 窗口终点：今天 23:59:59.999（即今天结束）
  const windowEnd = new Date(today)
  windowEnd.setHours(23, 59, 59, 999)

  let intakeMl = 0, outputMl = 0
  for (const e of allEntries) {
    const ts = new Date(e.timestamp)
    if (ts < windowStart || ts > windowEnd) continue
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

  let icon = '', title = '', detail = '', extra = '', cls = ''

  if (entry.type === 'meal') {
    icon = '🥩'; cls = 'cc-meal'
    title = entry.foodName ?? (entry.foodType === 'canned' ? '德罐' : '自制')
    const wml = parseFloat((entry.weightG * entry.waterPct / 100).toFixed(1))
    detail = `${entry.weightG}g · ${wml}ml`
    const sups = [...(entry.probiotics ? ['益生菌'] : []), ...(entry.fishOil ? ['鱼油'] : [])]
    if (sups.length) extra = sups.join(' ')
  } else if (entry.type === 'pee') {
    icon = '🚰'; cls = 'cc-pee'
    title = `${peeMl(entry)} ml`
    detail = entry.usg ? `USG ${entry.usg}` : ''
  } else if (entry.type === 'poop') {
    icon = '💩'; cls = 'cc-poop'
    title = { hard: '硬便', normal: '正常便', soft: '软便', liquid: '稀便' }[entry.consistency]
  } else {
    icon = '😺'; cls = 'cc-mental'
    if (entry.status) {
      title = { good: '精神好', normal: '精神正常', poor: '精神差' }[entry.status]
    } else {
      title = `逗猫棒 ${entry.playedWand ? '✓' : '✗'} · 跑酷 ${entry.didParkour ? '✓' : '✗'}`
      detail = entry.otherNote ?? ''
    }
  }

  return (
    <div className={`compact-card ${cls}`}>
      <span className="cc-time">{time}</span>
      <span className="cc-icon">{icon}</span>
      <div className="cc-body">
        <span className="cc-title">{title}</span>
        {detail && <span className="cc-detail">{detail}</span>}
        {extra  && <span className="cc-extra">{extra}</span>}
      </div>
      <button className="cc-del" onClick={onDelete}>×</button>
    </div>
  )
}

// ─── Quick-add buttons ────────────────────────────────────────────────────────

type EntryType = EntryData['type']

const ACTIONS: { type: EntryType; icon: string; label: string; cls: string }[] = [
  { type: 'meal',   icon: '🥩', label: '吃饭', cls: 'qa-meal'   },
  { type: 'pee',    icon: '🚰', label: '尿尿', cls: 'qa-pee'    },
  { type: 'poop',   icon: '💩', label: '拉屎', cls: 'qa-poop'   },
  { type: 'mental', icon: '😺', label: '精神', cls: 'qa-mental' },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  entries:     LogEntry[]
  getDay:      (dateStr: string) => LogEntry[]
  addEntry:    (data: EntryData, ts: string) => void
  deleteEntry: (id: string) => void
}

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export function WeekLogView({ entries, getDay, addEntry, deleteEntry }: Props) {
  const todayStr = toDateStr(new Date())

  // offset: 0 = 昨天+今天, -2 = 前天+大前天, ...
  const [offset, setOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sheetType, setSheetType] = useState<EntryType | null>(null)
  const [fabOpen, setFabOpen] = useState(false)

  useEffect(() => {
    setSelectedDate(todayStr)
  }, [todayStr])

  const today = new Date(); today.setHours(0, 0, 0, 0)

  // 合并水分（昨天07:00 → 今天24:00，固定统计窗口）
  const combined = calcCombinedWater(entries, today)
  const combinedHasData = combined.intakeMl > 0 || combined.outputMl > 0

  // Build the two days to show based on offset
  const rightDay = new Date(today); rightDay.setDate(rightDay.getDate() + offset)
  const leftDay  = new Date(today); leftDay.setDate(leftDay.getDate() + offset - 1)
  const days = [leftDay, rightDay]

  const isAtLatest = offset === 0

  function shiftDays(delta: number) {
    const newOffset = offset + delta
    setOffset(newOffset)
    // auto-select the right column's date after shift
    const newRight = new Date(today); newRight.setDate(today.getDate() + newOffset)
    setSelectedDate(toDateStr(newRight))
  }

  const selDate = new Date(selectedDate)
  const selLabel = `${MONTH_NAMES[selDate.getMonth()]}${selDate.getDate()}日 ${DAY_NAMES[selDate.getDay()]}`

  function dayLabel(d: Date) {
    const todayD = new Date(today)
    const diff = Math.round((d.getTime() - todayD.getTime()) / 86400000)
    if (diff === 0)  return '今天'
    if (diff === -1) return '昨天'
    if (diff === -2) return '前天'
    return `${d.getMonth()+1}/${d.getDate()}`
  }

  return (
    <div className="wlv">

      {/* ── Date navigation header ── */}
      <div className="wlv-date-nav">
        <button className="wlv-nav-arrow" onClick={() => shiftDays(-2)}>‹</button>
        <span className="wlv-nav-range">
          {`${leftDay.getMonth()+1}/${leftDay.getDate()} – ${rightDay.getMonth()+1}/${rightDay.getDate()}`}
        </span>
        <button className="wlv-nav-arrow" onClick={() => shiftDays(2)} disabled={isAtLatest}>›</button>
      </div>

      {/* ── Grid: two days ── */}
      <div className="wlv-scroll">
        <div className="wlv-grid">
          {days.map(d => {
            const ds      = toDateStr(d)
            const dayEntries = getDay(ds)
            const isToday = ds === todayStr
            const isSel   = ds === selectedDate

            return (
              <div key={ds} className={`wlv-col${isSel ? ' wlv-selected' : ''}${isToday ? ' wlv-today' : ''}`}>
                {/* column header */}
                <button className="wlv-col-head" onClick={() => setSelectedDate(ds)}>
                  <span className="wlv-day-name">{dayLabel(d)}</span>
                  <span className="wlv-day-date">{d.getMonth()+1}/{d.getDate()}</span>
                  {isSel && <span className="wlv-sel-dot" />}
                </button>

                {/* entries */}
                <div className="wlv-entries">
                  {dayEntries.length === 0
                    ? <div className="wlv-empty">暂无记录</div>
                    : dayEntries.map(entry => (
                        <CompactCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />
                      ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Combined water balance panel ── */}
      {combinedHasData && (
        <div className={`wlv-water-panel ${combined.balance >= 0 ? 'wlv-wp-ok' : 'wlv-wp-warn'}`}>
          <span className="wlv-wp-title">💧 昨天 07:00 → 今天</span>
          <div className="wlv-wp-stats">
            <span className="wlv-wp-item">
              <span className="wlv-wp-label">摄入</span>
              <strong>{combined.intakeMl} ml</strong>
            </span>
            <span className="wlv-wp-sep">·</span>
            <span className="wlv-wp-item">
              <span className="wlv-wp-label">排出</span>
              <strong>{combined.outputMl} ml</strong>
            </span>
            <span className="wlv-wp-sep">·</span>
            <span className={`wlv-wp-balance ${combined.balance >= 0 ? 'wp-ok' : 'wp-warn'}`}>
              {combined.balance >= 0 ? '+' : ''}{combined.balance} ml
            </span>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      {fabOpen && <div className="fab-backdrop" onClick={() => setFabOpen(false)} />}
      <div className="fab-container">
        {fabOpen && (
          <div className="fab-menu">
            <span className="fab-target-label">记录到 {selLabel}</span>
            {ACTIONS.map(a => (
              <button key={a.type} className={`fab-item ${a.cls}`} onClick={() => { setFabOpen(false); setSheetType(a.type) }}>
                <span className="fab-item-icon">{a.icon}</span>
                <span className="fab-item-label">{a.label}</span>
              </button>
            ))}
          </div>
        )}
        <button className={`fab-main${fabOpen ? ' fab-main--open' : ''}`} onClick={() => setFabOpen(o => !o)}>+</button>
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
