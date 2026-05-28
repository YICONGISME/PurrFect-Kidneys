import { useState } from 'react'
import { useCatProfile } from '../store'
import type { CatProfile } from '../types'
import { uploadToGist, downloadFromGist } from '../hooks/useGistSync'
import type { SyncStatus } from '../hooks/useGistSync'

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

  // ── Gist 同步状态 ──
  const [pat,    setPat]    = useState(() => localStorage.getItem('pk:gist-pat')    ?? '')
  const [gistId, setGistId] = useState(() => localStorage.getItem('pk:gist-id')     ?? '')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMsg,    setSyncMsg]    = useState('')

  function savePat(v: string)    { setPat(v);    localStorage.setItem('pk:gist-pat', v) }
  function saveGistId(v: string) { setGistId(v); localStorage.setItem('pk:gist-id',  v) }

  async function handleUpload() {
    if (!pat) { setSyncMsg('请先填写 GitHub Token'); setSyncStatus('error'); return }
    setSyncStatus('loading'); setSyncMsg('上传中…')
    try {
      const id = await uploadToGist({ pat, gistId })
      saveGistId(id)
      setSyncStatus('success')
      setSyncMsg(`✅ 上传成功！Gist ID: ${id}`)
    } catch (e) {
      setSyncStatus('error')
      setSyncMsg(`❌ 上传失败：${(e as Error).message}`)
    }
  }

  async function handleDownload() {
    if (!pat)    { setSyncMsg('请先填写 GitHub Token'); setSyncStatus('error'); return }
    if (!gistId) { setSyncMsg('请先填写 Gist ID'); setSyncStatus('error'); return }
    setSyncStatus('loading'); setSyncMsg('下载中…')
    try {
      const time = await downloadFromGist({ pat, gistId })
      setSyncStatus('success')
      setSyncMsg(`✅ 下载成功！备份时间：${new Date(time).toLocaleString('zh-CN')}`)
      // 刷新页面让数据生效
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      setSyncStatus('error')
      setSyncMsg(`❌ 下载失败：${(e as Error).message}`)
    }
  }

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
          <input className="form-input" type="number" step="0.01" min="0.1" value={profile.weightKg} onChange={e => update('weightKg', Number(e.target.value))} />
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

      {/* GitHub Gist 同步 */}
      <div className="form-card gist-sync-card">
        <h3 className="gist-sync-title">☁️ GitHub Gist 数据同步</h3>
        <p className="gist-sync-hint">
          在 GitHub → Settings → Developer settings → Personal access tokens (classic)
          创建一个只勾选 <strong>gist</strong> 权限的 token，填入下方即可跨设备备份。
        </p>

        <label className="form-label">
          GitHub Token
          <input
            className="form-input gist-pat-input"
            type="password"
            value={pat}
            onChange={e => savePat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
          />
        </label>

        <label className="form-label">
          Gist ID
          <input
            className="form-input"
            type="text"
            value={gistId}
            onChange={e => saveGistId(e.target.value)}
            placeholder="首次上传后自动填入，也可手动粘贴"
          />
        </label>

        <div className="gist-sync-actions">
          <button
            className="btn-gist btn-gist-upload"
            onClick={handleUpload}
            disabled={syncStatus === 'loading'}
          >
            📤 上传到 Gist
          </button>
          <button
            className="btn-gist btn-gist-download"
            onClick={handleDownload}
            disabled={syncStatus === 'loading'}
          >
            📥 从 Gist 下载
          </button>
        </div>

        {syncMsg && (
          <p className={`gist-sync-msg gist-sync-msg--${syncStatus}`}>{syncMsg}</p>
        )}
      </div>
    </div>
  )
}
