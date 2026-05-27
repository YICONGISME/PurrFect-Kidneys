import { useCatProfile } from '../store'
import type { CatProfile } from '../types'

const FACTORS: { value: number; label: string }[] = [
  { value: 1.0, label: '× 1.0 — 静息 / 生病 / CKD' },
  { value: 1.2, label: '× 1.2 — 绝育成猫' },
  { value: 1.4, label: '× 1.4 — 未绝育成猫' },
  { value: 1.6, label: '× 1.6 — 轻度活跃' },
]

export function ProfilePage() {
  const { profile, setProfile, rer, der, dailyWaterMl } = useCatProfile()

  function update<K extends keyof CatProfile>(key: K, val: CatProfile[K]) {
    setProfile(p => ({ ...p, [key]: val }))
  }

  const hasProfile = !!profile.name

  return (
    <div className="page profile-page">
      <h2 className="page-title">🐱 猫咪档案</h2>

      {hasProfile && (
        <div className="energy-card">
          <div className="energy-row">
            <div className="energy-item">
              <span className="energy-label">RER 静息能量</span>
              <span className="energy-value">{rer.toFixed(0)} <small>kcal/天</small></span>
            </div>
            <div className="energy-item highlight">
              <span className="energy-label">DER 每日需求</span>
              <span className="energy-value">{der.toFixed(0)} <small>kcal/天</small></span>
            </div>
            <div className="energy-item">
              <span className="energy-label">每日需水</span>
              <span className="energy-value">{dailyWaterMl.toFixed(0)} <small>ml/天</small></span>
            </div>
          </div>
          <p className="energy-formula">RER = 30 × {profile.weightKg} + 70　DER = RER × {profile.activityFactor}</p>
        </div>
      )}

      <div className="form-card">
        <label className="form-label">
          猫咪名字
          <input className="form-input" type="text" value={profile.name} onChange={e => update('name', e.target.value)} placeholder="例如：小橘" />
        </label>
        <label className="form-label">
          品种
          <input className="form-input" type="text" value={profile.breed} onChange={e => update('breed', e.target.value)} placeholder="例如：橘猫" />
        </label>
        <label className="form-label">
          出生日期
          <input className="form-input" type="date" value={profile.birthDate} onChange={e => update('birthDate', e.target.value)} />
        </label>
        <label className="form-label">
          体重 (kg)
          <input className="form-input" type="number" step="0.1" min="0.5" value={profile.weightKg} onChange={e => update('weightKg', Number(e.target.value))} />
        </label>
        <label className="form-label">
          能量系数
          <select className="form-input" value={profile.activityFactor} onChange={e => update('activityFactor', Number(e.target.value))}>
            {FACTORS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
      </div>

      <div className="formula-note">
        <p>RER = 30 × 体重(kg) + 70　（线性公式，适用于 2–45 kg 猫）</p>
        <p>DER = RER × 能量系数</p>
        <p>每日需水 = 体重(kg) × 45 ml</p>
      </div>
    </div>
  )
}
