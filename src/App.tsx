import { useState, useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { WaterPage } from './pages/WaterPage'
import { FoodPage } from './pages/FoodPage'
import { MedicationsPage } from './pages/MedicationsPage'
import { LabsPage } from './pages/LabsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useCats } from './store/useAppStore'
import type { NavTab } from './types'

export default function App() {
  const { cats } = useCats()
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [activeCatId, setActiveCatId] = useState<string | null>(null)

  useEffect(() => {
    if (cats.length > 0 && !activeCatId) {
      setActiveCatId(cats[0].id)
    }
    if (cats.length === 0) {
      setActiveTab('settings')
    }
  }, [cats, activeCatId])

  const activeCat = cats.find(c => c.id === activeCatId) ?? null

  function handleSelectCat(id: string) {
    setActiveCatId(id)
    setActiveTab('dashboard')
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">🐾</span>
        <span className="app-title">PurrFect Kidneys</span>
        {activeCat && (
          <span className="header-cat-name">{activeCat.avatar || '🐱'} {activeCat.name}</span>
        )}
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && activeCat && <Dashboard cat={activeCat} />}
        {activeTab === 'water' && activeCat && <WaterPage cat={activeCat} />}
        {activeTab === 'food' && activeCat && <FoodPage cat={activeCat} />}
        {activeTab === 'medications' && activeCat && <MedicationsPage cat={activeCat} />}
        {activeTab === 'labs' && activeCat && <LabsPage cat={activeCat} />}
        {activeTab === 'settings' && (
          <SettingsPage cat={activeCat} onSelectCat={handleSelectCat} />
        )}
        {!activeCat && activeTab !== 'settings' && (
          <div className="no-cat">
            <p>请先在设置中添加猫咪档案</p>
            <button className="btn-primary" onClick={() => setActiveTab('settings')}>前往设置</button>
          </div>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
