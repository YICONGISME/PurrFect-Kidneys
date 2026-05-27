import { useState } from 'react'
import { useLogEntries } from '../store'
import { DayView }    from '../components/DayView'
import { WeekSummary } from '../components/WeekSummary'

export function LogPage() {
  const { getDay, addEntry, deleteEntry } = useLogEntries()
  const [view, setView] = useState<'day' | 'week'>('day')

  return (
    <div className="log-page">
      <div className="log-view-toggle">
        <button className={`lvt-btn${view === 'day'  ? ' active' : ''}`} onClick={() => setView('day')}>今日</button>
        <button className={`lvt-btn${view === 'week' ? ' active' : ''}`} onClick={() => setView('week')}>本周</button>
      </div>

      {view === 'day'
        ? <DayView    getDay={getDay} addEntry={addEntry} deleteEntry={deleteEntry} />
        : <WeekSummary getDay={getDay} />
      }
    </div>
  )
}
