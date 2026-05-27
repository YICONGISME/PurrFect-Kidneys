import { useLogEntries } from '../store'
import { WeekTable } from '../components/WeekTable'

export function LogPage() {
  const { getDay, addEntry, deleteEntry } = useLogEntries()
  return (
    <div className="page">
      <WeekTable getDay={getDay} addEntry={addEntry} deleteEntry={deleteEntry} />
    </div>
  )
}
