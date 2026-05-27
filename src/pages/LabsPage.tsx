import { useState } from 'react'
import { useLabResults } from '../store/useAppStore'
import type { Cat } from '../types'

interface Props { cat: Cat }

export function LabsPage({ cat }: Props) {
  const { results, addResult, deleteResult } = useLabResults(cat.id)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    labName: '',
    creatinine: '',
    bun: '',
    phosphorus: '',
    potassium: '',
    hematocrit: '',
    sdma: '',
    usg: '',
    systolicBp: '',
    weightKg: '',
    notes: '',
  })

  function update(field: keyof typeof form, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parse = (v: string) => v.trim() ? Number(v) : undefined
    addResult({
      date: form.date,
      type: 'blood',
      labName: form.labName || undefined,
      creatinine: parse(form.creatinine),
      bun: parse(form.bun),
      phosphorus: parse(form.phosphorus),
      potassium: parse(form.potassium),
      hematocrit: parse(form.hematocrit),
      sdma: parse(form.sdma),
      usg: parse(form.usg),
      systolicBp: parse(form.systolicBp),
      weightKg: parse(form.weightKg),
      notes: form.notes || undefined,
    })
    setForm(f => ({ ...f, creatinine: '', bun: '', phosphorus: '', potassium: '', hematocrit: '', sdma: '', usg: '', systolicBp: '', weightKg: '', notes: '', labName: '' }))
    setShowForm(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>🔬 检验记录</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '+ 录入'}
        </button>
      </div>

      {showForm && (
        <form className="record-form" onSubmit={handleSubmit}>
          <h3>录入检验结果</h3>
          <div className="form-row">
            <label style={{ flex: 2 }}>
              检验日期
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required />
            </label>
            <label style={{ flex: 2 }}>
              医院/机构（可选）
              <input type="text" value={form.labName} onChange={e => update('labName', e.target.value)} placeholder="例如：XX动物医院" />
            </label>
          </div>

          <div className="form-section-title">血液指标</div>
          <div className="form-grid">
            <NumberField label="肌酐 (Cre)" unit="mg/dL" value={form.creatinine} onChange={v => update('creatinine', v)} />
            <NumberField label="尿素氮 (BUN)" unit="mg/dL" value={form.bun} onChange={v => update('bun', v)} />
            <NumberField label="磷 (P)" unit="mg/dL" value={form.phosphorus} onChange={v => update('phosphorus', v)} />
            <NumberField label="血钾 (K)" unit="mEq/L" value={form.potassium} onChange={v => update('potassium', v)} />
            <NumberField label="红细胞压积 (HCT)" unit="%" value={form.hematocrit} onChange={v => update('hematocrit', v)} />
            <NumberField label="SDMA" unit="µg/dL" value={form.sdma} onChange={v => update('sdma', v)} />
          </div>

          <div className="form-section-title">其他指标</div>
          <div className="form-grid">
            <NumberField label="尿比重 (USG)" unit="" value={form.usg} onChange={v => update('usg', v)} />
            <NumberField label="收缩压" unit="mmHg" value={form.systolicBp} onChange={v => update('systolicBp', v)} />
            <NumberField label="体重" unit="kg" value={form.weightKg} onChange={v => update('weightKg', v)} />
          </div>

          <label>
            备注
            <input type="text" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="可选" />
          </label>
          <button type="submit" className="btn-primary btn-full">保存</button>
        </form>
      )}

      <div className="section">
        <h3 className="section-title">历史记录</h3>
        {results.length === 0 ? (
          <p className="empty-state">暂无检验记录</p>
        ) : (
          <div className="lab-records">
            {results.map(r => (
              <div key={r.id} className="lab-record-card">
                <div className="lab-record-header">
                  <span className="lab-record-date">{new Date(r.date).toLocaleDateString('zh-CN')}</span>
                  {r.labName && <span className="lab-record-lab">{r.labName}</span>}
                  <button className="btn-delete" onClick={() => deleteResult(r.id)}>✕</button>
                </div>
                <div className="lab-record-values">
                  <LabValue label="Cre" value={r.creatinine} unit="mg/dL" />
                  <LabValue label="BUN" value={r.bun} unit="mg/dL" />
                  <LabValue label="P" value={r.phosphorus} unit="mg/dL" />
                  <LabValue label="K" value={r.potassium} unit="mEq/L" />
                  <LabValue label="HCT" value={r.hematocrit} unit="%" />
                  <LabValue label="SDMA" value={r.sdma} unit="µg/dL" />
                  <LabValue label="收缩压" value={r.systolicBp} unit="mmHg" />
                  <LabValue label="体重" value={r.weightKg} unit="kg" />
                </div>
                {r.notes && <p className="lab-record-notes">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NumberField({ label, unit, value, onChange }: {
  label: string; unit: string; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="number-field">
      {label} {unit && <span className="field-unit">({unit})</span>}
      <input type="number" step="any" min="0" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function LabValue({ label, value, unit }: { label: string; value?: number; unit: string }) {
  if (value === undefined) return null
  return (
    <div className="lab-value-chip">
      <span className="lvc-label">{label}</span>
      <span className="lvc-val">{value} {unit}</span>
    </div>
  )
}
