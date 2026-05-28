import { useState } from 'react'
import type { LogEntry } from '../types'
import { getWeekStart, getWeekDays, toDateStr } from '../store'

// ─── helpers ──────────────────────────────────────────────────────────────────

const PEE_ML = { little: 15, normal: 35, lots: 60 }

function peeMl(e: LogEntry & { type: 'pee' }) {
  return e.litterWeightG && e.litterWeightG > 0 ? e.litterWeightG / 4 : PEE_ML[e.amount]
}

const POOP_LABEL: Record<string, string> = { hard: '硬便', normal: '正常', soft: '软便', liquid: '稀便' }
const MENTAL_LABEL: Record<string, string> = { good: '好', normal: '正常', poor: '差' }
const MENTAL_COLOR: Record<string, string> = { good: '#38A169', normal: '#718096', poor: '#E53E3E' }
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function summarise(entries: LogEntry[]) {
  const meals  = entries.filter(e => e.type === 'meal')  as (LogEntry & { type: 'meal'   })[]
  const pees   = entries.filter(e => e.type === 'pee')   as (LogEntry & { type: 'pee'    })[]
  const poops  = entries.filter(e => e.type === 'poop')  as (LogEntry & { type: 'poop'   })[]
  const mentals= entries.filter(e => e.type === 'mental')as (LogEntry & { type: 'mental' })[]

  return {
    meal: meals.length ? {
      count:   meals.length,
      totalG:  meals.reduce((s, m) => s + m.weightG, 0),
      waterMl: meals.reduce((s, m) => s + m.weightG * m.waterPct / 100, 0),
      label:   meals[0].foodName ?? (meals[0].foodType === 'canned' ? '德罐' : '自制'),
      multi:   meals.length > 1,
    } : null,
    pee: pees.length ? {
      count:   pees.length,
      totalMl: pees.reduce((s, p) => s + peeMl(p), 0),
    } : null,
    poop: poops.length ? {
      count: poops.length,
      last:  POOP_LABEL[poops[poops.length - 1].consistency],
    } : null,
    mental: mentals.length ? (() => {
      const last = mentals[mentals.length - 1]
      return last.status
        ? { text: MENTAL_LABEL[last.status], color: MENTAL_COLOR[last.status] }
        : { text: `玩${last.playedWand ? '✓' : '✗'} 跑${last.didParkour ? '✓' : '✗'}`, color: '#1A202C' }
    })() : null,
  }
}

// ─── Cell components ──────────────────────────────────────────────────────────

function Empty() {
  return <span className="wt-empty">—</span>
}

function MealCell({ s }: { s: ReturnType<typeof summarise>['meal'] }) {
  if (!s) return <Empty />
  return (
    <div className="wt-cell-inner">
      <span className="wt-main">{s.label}{s.multi ? ` ×${s.count}` : ''}</span>
      <span className="wt-sub">{s.totalG.toFixed(0)}g · {s.waterMl.toFixed(0)}ml</span>
    </div>
  )
}

function PeeCell({ s }: { s: ReturnType<typeof summarise>['pee'] }) {
  if (!s) return <Empty />
  return (
    <div className="wt-cell-inner">
      <span className="wt-main">×{s.count}</span>
      <span className="wt-sub">{parseFloat(s.totalMl.toFixed(3))} ml</span>
    </div>
  )
}

function PoopCell({ s }: { s: ReturnType<typeof summarise>['poop'] }) {
  if (!s) return <Empty />
  return (
    <div className="wt-cell-inner">
      <span className="wt-main">×{s.count}</span>
      <span className="wt-sub">{s.last}</span>
    </div>
  )
}

function MentalCell({ s }: { s: ReturnType<typeof summarise>['mental'] }) {
  if (!s) return <Empty />
  return (
    <span className="wt-main" style={{ color: s.color }}>
      {s.text}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  getDay: (dateStr: string) => LogEntry[]
}

export function WeekSummary({ getDay }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const days    = getWeekDays(weekStart)
  const todayStr = toDateStr(new Date())

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  const [s, e] = [days[0], days[6]]
  const weekLabel = `${s.getMonth()+1}月${s.getDate()}日 – ${e.getMonth()+1}月${e.getDate()}日`

  return (
    <div className="week-summary">
      {/* week nav */}
      <div className="ws-nav">
        <button className="ws-nav-btn" onClick={prevWeek}>‹</button>
        <span className="ws-week-label">{weekLabel}</span>
        <button className="ws-nav-btn" onClick={nextWeek}>›</button>
      </div>

      {/* table */}
      <div className="wt-table">
        {/* header */}
        <div className="wt-row wt-header-row">
          <div className="wt-date-cell" />
          <div className="wt-type-head wt-head-meal">🥩 吃饭</div>
          <div className="wt-type-head wt-head-pee" >🚰 尿尿</div>
          <div className="wt-type-head wt-head-poop">💩 拉屎</div>
          <div className="wt-type-head wt-head-mental">😺 精神</div>
        </div>

        {/* day rows */}
        {days.map(d => {
          const ds      = toDateStr(d)
          const entries = getDay(ds)
          const sum     = summarise(entries)
          const isToday = ds === todayStr

          return (
            <div key={ds} className={`wt-row${isToday ? ' wt-today' : ''}`}>
              <div className="wt-date-cell">
                <span className="wt-day-name">{DAY_NAMES[d.getDay()]}</span>
                <span className="wt-day-date">{d.getMonth()+1}/{d.getDate()}</span>
              </div>
              <div className="wt-cell wt-cell-meal"><MealCell   s={sum.meal}   /></div>
              <div className="wt-cell wt-cell-pee" ><PeeCell    s={sum.pee}    /></div>
              <div className="wt-cell wt-cell-poop"><PoopCell   s={sum.poop}   /></div>
              <div className="wt-cell wt-cell-mental"><MentalCell s={sum.mental} /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
