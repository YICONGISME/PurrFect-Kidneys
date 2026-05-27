import { useState } from 'react'
import { useWaterIntake } from '../store/useAppStore'
import type { Cat, WaterIntake } from '../types'

const SOURCE_LABELS: Record<WaterIntake['source'], string> = {
  bowl: '水碗',
  fountain: '饮水机',
  wet_food: '湿粮',
  syringe: '注射器喂水',
  other: '其他',
}

interface Props { cat: Cat }

export function WaterPage({ cat }: Props) {
  const { logs, addLog, deleteLog, todayTotal } = useWaterIntake(cat.id)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<WaterIntake['source']>('bowl')
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter(l => l.date.startsWith(today))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    addLog({
      date: new Date().toISOString(),
      amountMl: Number(amount),
      source,
      notes: notes || undefined,
    })
    setAmount('')
    setNotes('')
    setShowForm(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>💧 饮水记录</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 记录'}
        </button>
      </div>

      <div className="daily-summary">
        <div className="summary-value">{todayTotal} ml</div>
        <div className="summary-label">今日摄水量</div>
        <div className="progress-bar">
          <div
            className="progress-fill water"
            style={{ width: `${Math.min((todayTotal / 200) * 100, 100)}%` }}
          />
        </div>
        <div className="progress-hint">建议每日 ≥ 200 ml</div>
      </div>

      {showForm && (
        <form className="record-form" onSubmit={handleSubmit}>
          <h3>添加饮水记录</h3>
          <label>
            摄水量 (ml)
            <input
              type="number"
              min="1"
              max="1000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="输入毫升数"
              required
            />
          </label>
          <label>
            来源
            <select value={source} onChange={e => setSource(e.target.value as WaterIntake['source'])}>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            备注（可选）
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：主动喝水"
            />
          </label>
          <button type="submit" className="btn-primary btn-full">保存</button>
        </form>
      )}

      <div className="section">
        <h3 className="section-title">今日记录</h3>
        {todayLogs.length === 0 ? (
          <p className="empty-state">今天还没有饮水记录</p>
        ) : (
          <div className="log-list">
            {todayLogs.map(log => (
              <div key={log.id} className="log-item">
                <span className="log-icon">💧</span>
                <div className="log-info">
                  <span className="log-main">{log.amountMl} ml · {SOURCE_LABELS[log.source]}</span>
                  <span className="log-time">
                    {new Date(log.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    {log.notes && ` · ${log.notes}`}
                  </span>
                </div>
                <button className="btn-delete" onClick={() => deleteLog(log.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
