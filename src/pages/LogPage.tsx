import { useLogEntries } from '../store'
import { DayView } from '../components/DayView'

export function LogPage() {
  const { getDay, addEntry, deleteEntry } = useLogEntries()
  return <DayView getDay={getDay} addEntry={addEntry} deleteEntry={deleteEntry} />
}
