import { useState } from 'react'
import { useCats } from '../store/useAppStore'
import type { Cat, CKDStage } from '../types'

interface Props {
  cat: Cat | null
  onSelectCat: (id: string) => void
}

const CKD_STAGES: { value: CKDStage; label: string }[] = [
  { value: 'unknown', label: '待确认' },
  { value: 'stage1', label: '第一期' },
  { value: 'stage2', label: '第二期' },
  { value: 'stage3', label: '第三期' },
  { value: 'stage4', label: '第四期' },
]

const AVATARS = ['🐱', '🐈', '🐈‍⬛', '😺', '😸', '😻', '🙀', '😿']

export function SettingsPage({ cat, onSelectCat }: Props) {
  const { cats, addCat, updateCat } = useCats()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    breed: '',
    birthDate: '',
    weight: '',
    ckdStage: 'unknown' as CKDStage,
    diagnosisDate: '',
    avatar: '🐱',
    notes: '',
  })

  function startEdit() {
    if (!cat) return
    setForm({
      name: cat.name,
      breed: cat.breed,
      birthDate: cat.birthDate,
      weight: String(cat.weight),
      ckdStage: cat.ckdStage,
      diagnosisDate: cat.diagnosisDate,
      avatar: cat.avatar || '🐱',
      notes: cat.notes || '',
    })
    setEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      name: form.name,
      breed: form.breed,
      birthDate: form.birthDate,
      weight: Number(form.weight),
      ckdStage: form.ckdStage,
      diagnosisDate: form.diagnosisDate,
      avatar: form.avatar,
      notes: form.notes || undefined,
    }
    if (editing && cat) {
      updateCat(cat.id, data)
      setEditing(false)
    } else {
      addCat(data)
      setShowForm(false)
    }
    setForm({ name: '', breed: '', birthDate: '', weight: '', ckdStage: 'unknown', diagnosisDate: '', avatar: '🐱', notes: '' })
  }

  function update(field: keyof typeof form, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const showingForm = showForm || editing

  return (
    <div className="page">
      <div className="page-header">
        <h2>⚙️ 设置</h2>
      </div>

      {cats.length === 0 && !showingForm && (
        <div className="onboarding">
          <div className="onboarding-icon">🐱</div>
          <h3>欢迎使用 PurrFect Kidneys</h3>
          <p>专为猫咪肾病管理设计的工具。请先添加你的猫咪档案。</p>
          <button className="btn-primary btn-full" onClick={() => setShowForm(true)}>+ 添加猫咪档案</button>
        </div>
      )}

      {cats.length > 0 && !showingForm && (
        <div className="section">
          <h3 className="section-title">猫咪档案</h3>
          <div className="cat-list">
            {cats.map(c => (
              <div
                key={c.id}
                className={`cat-list-item ${cat?.id === c.id ? 'active' : ''}`}
                onClick={() => onSelectCat(c.id)}
              >
                <span className="cat-list-avatar">{c.avatar || '🐱'}</span>
                <div className="cat-list-info">
                  <span className="cat-list-name">{c.name}</span>
                  <span className="cat-list-meta">{c.breed} · CKD {c.ckdStage.replace('stage', '期').replace('unknown', '待确认')}</span>
                </div>
                {cat?.id === c.id && <span className="cat-selected">✓</span>}
              </div>
            ))}
          </div>
          <div className="settings-actions">
            <button className="btn-secondary" onClick={() => setShowForm(true)}>+ 添加猫咪</button>
            {cat && <button className="btn-secondary" onClick={startEdit}>编辑档案</button>}
          </div>
        </div>
      )}

      {showingForm && (
        <form className="record-form" onSubmit={handleSubmit}>
          <h3>{editing ? '编辑档案' : '添加猫咪档案'}</h3>

          <div className="avatar-picker">
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                className={`avatar-opt ${form.avatar === a ? 'selected' : ''}`}
                onClick={() => update('avatar', a)}
              >{a}</button>
            ))}
          </div>

          <label>
            猫咪名字
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="例如：小橘" required />
          </label>
          <div className="form-row">
            <label style={{ flex: 1 }}>
              品种
              <input type="text" value={form.breed} onChange={e => update('breed', e.target.value)} placeholder="例如：橘猫" />
            </label>
            <label style={{ flex: 1 }}>
              体重 (kg)
              <input type="number" step="0.1" value={form.weight} onChange={e => update('weight', e.target.value)} required />
            </label>
          </div>
          <div className="form-row">
            <label style={{ flex: 1 }}>
              出生日期
              <input type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>
              确诊日期
              <input type="date" value={form.diagnosisDate} onChange={e => update('diagnosisDate', e.target.value)} />
            </label>
          </div>
          <label>
            CKD 分期
            <select value={form.ckdStage} onChange={e => update('ckdStage', e.target.value)}>
              {CKD_STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label>
            备注（可选）
            <input type="text" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="任何需要记录的信息" />
          </label>
          <div className="form-row">
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>保存</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowForm(false); setEditing(false) }}>取消</button>
          </div>
        </form>
      )}

      <div className="section">
        <h3 className="section-title">关于</h3>
        <div className="about-card">
          <p><strong>PurrFect Kidneys</strong> v1.0.0</p>
          <p>专为慢性肾病（CKD）猫咪设计的健康管理工具</p>
          <p className="about-disclaimer">⚠️ 本应用仅供记录和参考，不能替代兽医的专业诊断和建议。</p>
        </div>
      </div>
    </div>
  )
}
