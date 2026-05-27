import type { NavTab } from '../types'

const tabs: { id: NavTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: '总览', icon: '🏠' },
  { id: 'water', label: '饮水', icon: '💧' },
  { id: 'food', label: '饮食', icon: '🍽️' },
  { id: 'medications', label: '用药', icon: '💊' },
  { id: 'labs', label: '检验', icon: '🔬' },
  { id: 'settings', label: '设置', icon: '⚙️' },
]

interface Props {
  active: NavTab
  onChange: (tab: NavTab) => void
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
