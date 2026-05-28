import { useLogEntries } from '../store'
import { WeekLogView } from '../components/WeekLogView'

export function LogPage() {
  const { entries, getDay, addEntry, deleteEntry } = useLogEntries()
  return <WeekLogView entries={entries} getDay={getDay} addEntry={addEntry} deleteEntry={deleteEntry} />
}
