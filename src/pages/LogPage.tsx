import { useLogEntries } from '../store'
import { WeekLogView } from '../components/WeekLogView'

export function LogPage() {
  const { getDay, addEntry, deleteEntry } = useLogEntries()
  return <WeekLogView getDay={getDay} addEntry={addEntry} deleteEntry={deleteEntry} />
}
