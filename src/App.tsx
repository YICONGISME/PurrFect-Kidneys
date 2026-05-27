import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { LogPage } from './pages/LogPage'
import { NutritionPage } from './pages/NutritionPage'
import { ProfilePage } from './pages/ProfilePage'
import type { NavTab } from './types'

export default function App() {
  const [tab, setTab] = useState<NavTab>('log')
  return (
    <div className="app">
      <main className="app-main">
        {tab === 'log'       && <LogPage />}
        {tab === 'nutrition' && <NutritionPage />}
        {tab === 'profile'   && <ProfilePage />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
