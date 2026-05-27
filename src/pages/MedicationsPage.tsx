import { useState } from 'react'
import { useMedications } from '../store/useAppStore'
import type { Cat } from '../types'

interface Props { cat: Cat }

export function MedicationsPage({ cat }: Props) {
  const { meds, addMed, updateMed, logDose, todayLogs } = useMedications(cat.id)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [unit, setUnit] = useState('mg')
  const [frequency, setFrequency] = useState('每日一次')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const activeMeds = meds.filter(m => m.active)
  const inactiveMeds = meds.filter(m => !m.active)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !dosage) return
    addMed({ name, dosage, unit, frequency, startDate, active: true, notes: notes || undefined })
    setName('')
    setDosage('')
    setNotes('')
    setShowForm(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>💊 用药管理</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 添加'}
        </button>
      </div>

      {showForm && (
        <form className="record-form" onSubmit={handleSubmit}>
          <h3>添加药物</h3>
          <label>
            药物名称
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例如：苯磺酸氨氯地平" required />
          </label>
          <div className="form-row">
            <label style={{ flex: 1 }}>
              剂量
              <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="例如：0.625" required />
            </label>
            <label style={{ flex: 1 }}>
              单位
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                <option>mg</option>
                <option>ml</option>
                <option>片</option>
                <option>粒</option>
                <option>滴</option>
              </select>
            </label>
          </div>
          <label>
            频次
            <select value={frequency} onChange={e => setFrequency(e.target.value)}>
              <option>每日一次</option>
              <option>每日两次</option>
              <option>每日三次</option>
              <option>隔日一次</option>
              <option>每周一次</option>
              <option>按需使用</option>
            </select>
          </label>
          <label>
            开始日期
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </label>
          <label>
            备注（可选）
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="例如：随餐服用" />
          </label>
          <button type="submit" className="btn-primary btn-full">保存</button>
        </form>
      )}

      <div className="section">
        <h3 className="section-title">当前用药</h3>
        {activeMeds.length === 0 ? (
          <p className="empty-state">暂无用药记录</p>
        ) : (
          <div className="med-cards">
            {activeMeds.map(med => {
              const givenLog = todayLogs.find(l => l.medicationId === med.id && l.given)
              const skippedLog = todayLogs.find(l => l.medicationId === med.id && !l.given)
              const hasLogged = givenLog || skippedLog

              return (
                <div key={med.id} className={`med-card ${givenLog ? 'given' : ''}`}>
                  <div className="med-card-header">
                    <span className="med-card-name">{med.name}</span>
                    <button
                      className="btn-text btn-stop"
                      onClick={() => updateMed(med.id, { active: false })}
                    >停用</button>
                  </div>
                  <p className="med-card-dose">{med.dosage} {med.unit} · {med.frequency}</p>
                  {med.notes && <p className="med-card-notes">{med.notes}</p>}
                  {!hasLogged && (
                    <div className="med-actions">
                      <button className="btn-given" onClick={() => logDose(med.id, true)}>✅ 已给药</button>
                      <button className="btn-skip" onClick={() => logDose(med.id, false)}>⏭ 跳过</button>
                    </div>
                  )}
                  {givenLog && <p className="med-logged">✅ 今日已给药</p>}
                  {skippedLog && !givenLog && <p className="med-logged skipped">⏭ 今日已跳过</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {inactiveMeds.length > 0 && (
        <div className="section">
          <h3 className="section-title">已停用药物</h3>
          <div className="inactive-list">
            {inactiveMeds.map(med => (
              <div key={med.id} className="inactive-item">
                <span>{med.name}</span>
                <button className="btn-text" onClick={() => updateMed(med.id, { active: true })}>恢复</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
