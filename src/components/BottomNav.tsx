import type { NavTab } from '../types'

const TABS: { id: NavTab; icon: string; label: string }[] = [
  { id: 'log',       icon: '📋', label: '日志' },
  { id: 'nutrition', icon: '🧪', label: '营养' },
  { id: 'profile',   icon: '🐱', label: '档案' },
]

export function BottomNav({ active, onChange }: { active: NavTab; onChange: (t: NavTab) => void }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button key={t.id} className={`nav-btn${active === t.id ? ' active' : ''}`} onClick={() => onChange(t.id)}>
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
