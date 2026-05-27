import { useState } from 'react'
import { useFoodLog } from '../store/useAppStore'
import type { Cat, FoodLog } from '../types'

const TYPE_LABELS: Record<FoodLog['foodType'], string> = {
  dry: '干粮',
  wet: '湿粮',
  raw: '生骨肉',
  prescription: '处方粮',
  other: '其他',
}

interface Props { cat: Cat }

export function FoodPage({ cat }: Props) {
  const { logs, addLog, deleteLog } = useFoodLog(cat.id)
  const [showForm, setShowForm] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [amount, setAmount] = useState('')
  const [foodType, setFoodType] = useState<FoodLog['foodType']>('wet')
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter(l => l.date.startsWith(today))
  const todayTotal = todayLogs.reduce((s, l) => s + l.amountGrams, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!foodName || !amount) return
    addLog({
      date: new Date().toISOString(),
      foodName,
      amountGrams: Number(amount),
      foodType,
      notes: notes || undefined,
    })
    setFoodName('')
    setAmount('')
    setNotes('')
    setShowForm(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🍽️ 饮食记录</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 记录'}
        </button>
      </div>

      <div className="daily-summary">
        <div className="summary-value">{todayTotal} g</div>
        <div className="summary-label">今日摄食量</div>
      </div>

      {showForm && (
        <form className="record-form" onSubmit={handleSubmit}>
          <h3>添加饮食记录</h3>
          <label>
            食物名称
            <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)} placeholder="例如：皇家肾病处方粮" required />
          </label>
          <div className="form-row">
            <label style={{ flex: 1 }}>
              分量 (g)
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required />
            </label>
            <label style={{ flex: 1 }}>
              类型
              <select value={foodType} onChange={e => setFoodType(e.target.value as FoodLog['foodType'])}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            备注（可选）
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="例如：胃口很好" />
          </label>
          <button type="submit" className="btn-primary btn-full">保存</button>
        </form>
      )}

      <div className="section">
        <h3 className="section-title">今日记录</h3>
        {todayLogs.length === 0 ? (
          <p className="empty-state">今天还没有饮食记录</p>
        ) : (
          <div className="log-list">
            {todayLogs.map(log => (
              <div key={log.id} className="log-item">
                <span className="log-icon">🍽️</span>
                <div className="log-info">
                  <span className="log-main">{log.foodName} · {log.amountGrams}g · {TYPE_LABELS[log.foodType]}</span>
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
